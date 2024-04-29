import fetch from 'node-fetch';
import passport from 'passport';
import GitHubStrategy from 'passport-github2';
import local from 'passport-local';
import { UserModel } from '../DAO/models/users.model.js';
import { createHash, isValidPassword } from '../utils.js';
import { CartService } from '../services/carts.service.js';

const LocalStrategy = local.Strategy;
const cartService = new CartService();
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET; 

export function iniPassport() {
  passport.use(
    'login',
    new LocalStrategy({ usernameField: 'email' }, async (username, password, done) => {
      try {
        const user = await UserModel.findOne({ email: username });
        if (!user) {
          console.log('Usuario no encontrado con nombre de usuario (email) ' + username);
          return done(null, false);
        }
        if (!isValidPassword(password, user.password)) {
          console.log('Contraseña invalida');
          return done(null, false);
        }

        if (user.cart) {
          console.log(user.cart);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.use(
    'Registro',
    new LocalStrategy(
      {
        passReqToCallback: true,
        usernameField: 'email',
      },
      async (req, username, password, done) => {
        try {
          const { email, firstName, lastName, age } = req.body;
          let user = await UserModel.findOne({ email: username });
          if (user) {
            console.log('Usuario ya existe');
            return done(null, false);
          }

          const newUser = {
            email,
            firstName,
            lastName,
            age: Number(age),
            isAdmin: false,
            password: createHash(password),
            cart: await cartService.createCart(),
          };

          let userCreated = await UserModel.create(newUser);
          console.log(userCreated);
          console.log('Registro de usuario exitoso');
          return done(null, userCreated);
        } catch (e) {
          console.log('Error en el registro');
          console.log(e);
          return done(e);
        }
      }
    )
  );

  passport.use(
    'github',
    new GitHubStrategy(
      {
        clientID: '',
        clientSecret: '',
        callbackURL: 'http://localhost:8080/api/sessions/githubcallback',
      },
      async (accesToken, _, profile, done) => {
        try {
          const res = await fetch('https://api.github.com/user/emails', {
            headers: {
              Accept: 'application/vnd.github.v3+json',
              Authorization: 'Bearer ' + accessToken,
            },
          });
          const emails = await res.json();
          const emailDetail = emails.find((email) => email.verified == true);

          if (!emailDetail) {
            return done(new Error('no puedo obtener un correo electrónico válido para este usuario'));
          }
          profile.email = emailDetail.email;

          let user = await UserModel.findOne({ email: profile.email });
          if (!user) {
            const newUser = {
              email: profile.email,
              firstName: profile._json.name || profile._json.login || 'noname',
              lastName: 'nolast',
              isAdmin: false,
              password: 'nopass',
              age: null,
              cart: await cartService.createCart(),
            };
            let userCreated = await UserModel.create(newUser);
            console.log('User Regristado Correctamente');
            return done(null, userCreated);
          } else {
            console.log('User ya existe');
            return done(null, user);
          }
        } catch (e) {
          console.log('Error en autenticación github');
          console.log(e);
          return done(e);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    let user = await UserModel.findById(id);
    done(null, user);
  });
}
