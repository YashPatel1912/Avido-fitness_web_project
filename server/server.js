import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import requestIp from "request-ip"; // typo: reqestIp → requestIp
import { authRoute } from "./router/authRoute.js";
import {
  membershipPlanCheck,
  verifyAuthentiocationUser,
} from "./middleware/authmiddleware.js";

import { Pool } from "pg";
import connectPgSimple from "connect-pg-simple";

const app = express();

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PgStore = connectPgSimple(session);

// Middleware`
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin:
    process.env.FRONTEND_URL || "https://avido-fitness-web-project.vercel.app",
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

app.options("/", cors(corsOptions));

// Session middleware with PostgreSQL store
app.use(
  session({
    store: new PgStore({
      pool: pool,
    }),
    secret: "validation",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  }),
);

app.use(flash());
app.use(requestIp.mw());

app.use(verifyAuthentiocationUser);
app.use(membershipPlanCheck);

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use("/", authRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server is running on http://localhost:${PORT}`),
);
