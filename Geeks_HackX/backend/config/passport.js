const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

// ─── JWT Strategy (API clients) ───────────────────────────────────────────────
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.id).select('-password -pushTokens');
        if (!user || !user.isActive) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// ─── Google OAuth 2.0 Strategy ────────────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email returned from Google.'), false);

        // Find existing user by email
        let user = await User.findOne({ email });

        if (user) {
          // Existing user — mark as verified if coming via Google
          if (!user.isVerified) {
            user.isVerified = true;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // New user — create account (no password required for OAuth)
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email,
          // Random long password — user can set one later via change-password
          password: `Google_${profile.id}_${Math.random().toString(36).slice(2, 10)}Aa1!`,
          role: 'user',
          isVerified: true,
          avatar: {
            url: profile.photos?.[0]?.value || '',
            publicId: '',
          },
        });

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Passport does NOT use sessions — JWT is stateless
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password -pushTokens');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
