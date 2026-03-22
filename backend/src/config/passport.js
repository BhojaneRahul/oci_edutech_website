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
        const googlePhoto = profile.photos?.[0]?.value
          ? profile.photos[0].value.replace(/=s\d+-c$/, "=s256-c")
          : null;

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
              profilePhoto: googlePhoto
            }
          });
        } else if (!user.googleId || user.profilePhoto !== googlePhoto || user.name !== profile.displayName) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: profile.displayName,
              googleId: profile.id,
              profilePhoto: googlePhoto
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
