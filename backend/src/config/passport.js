import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          done(new Error("Google account email not available"));
          return;
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              name: profile.displayName,
              email,
              googleId: profile.id,
              profilePhoto: profile.photos?.[0]?.value
            }
          });
        } else if (!user.googleId || user.profilePhoto !== profile.photos?.[0]?.value || user.name !== profile.displayName) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: profile.displayName,
              googleId: profile.id,
              profilePhoto: profile.photos?.[0]?.value
            }
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

export default passport;
