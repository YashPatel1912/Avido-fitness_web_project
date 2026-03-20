import { and, eq, lt, sql } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../config/db.js";
import {
  contactTable,
  membershipTable,
  oauthAccountsTable,
  passwordResetTokenTables,
  paymentTable,
  personalDetailsTable,
  sessionTable,
  subscriptionTable,
  usersTable,
} from "../drizzle/schema.js";
import argon from "argon2";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRY,
  MILLISECONDS_PER_SECOND,
  REFRESH_TOKEN_EXPIRY,
} from "../config/constant.js";
import { log } from "console";

//* getUserByEmail
export const verifyUserbyEmail = async (email) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  return user;
};

//* hashedPassword
export const hashedPassword = async (password) => {
  return await argon.hash(password);
};

//* createUser
export const createUser = async ({ userName, email, password }) => {
  const user = await db
    .insert(usersTable)
    .values({ userName, email, password })
    .returning({ id: usersTable.id });
  return user;
};

//* comparePassword
export const comparePassword = async (hashPassword, password) => {
  return argon.verify(hashPassword, password);
};

//* createSession
export const createSession = async (userId, { ip, userAgent }) => {
  if (!userId) throw new Error("Missing userId in createSession");

  const [session] = await db
    .insert(sessionTable)
    .values({ userId, ip, userAgent })
    .returning({ id: usersTable.id });

  return session;
};

//* createAccessToken
export const createAccessToken = ({
  id,
  userName,
  email,
  isEmailValid,
  sessionId,
}) => {
  const payload = { id, userName, email, isEmailValid, sessionId };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

//* createRefreshToken
export const createRefreshToken = (sessionId) => {
  return jwt.sign({ sessionId }, process.env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND,
  });
};

//* authenticationUser
export const authenticationUser = async ({
  user,
  userName,
  email,
  req,
  res,
}) => {
  const session = await createSession(user.id, {
    ip: req.clientIp,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = createAccessToken({
    id: user.id,
    userName: user.userName || userName,
    email: user.email || email,
    isEmailValid: false,
    sessionId: session.id,
  });

  const refreshToken = createRefreshToken(session.id);

  const baseConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    sameSite: "none",
  };

  res.cookie("access_token", accessToken, {
    ...baseConfig,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refresh_token", refreshToken, {
    ...baseConfig,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken };
};

//* verifyJWTToken
export const verifyJWTToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

//* findSessionById
export const findSessionById = async (sessionId) => {
  const [session] = await db
    .select()
    .from(sessionTable)
    .where(eq(sessionTable.id, sessionId));
  return session;
};

//* findUserBySessionId
export const findUserBysessionId = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
};

//* verifyRefreshToken
export const verifyRefreshToken = async (refreshToken) => {
  try {
    const decodedToken = verifyJWTToken(refreshToken);
    const currentSession = await findSessionById(decodedToken.sessionId);

    if (!currentSession || !currentSession.valid) {
      throw new Error("Invalid credentials");
    }

    const user = await findUserBysessionId(currentSession.userId);

    const userInfo = {
      id: user.id,
      userName: user.userName,
      email: user.email,
      isEmailValid: false,
      sessionId: currentSession.id,
    };

    const newAccessToken = createAccessToken(userInfo);
    const newRefreshToken = createRefreshToken(currentSession.id);

    return { user, newAccessToken, newRefreshToken };
  } catch (error) {
    console.log(error.message);
  }
};

//* insertContactData
export const insertContactData = async ({ userId, name, email, message }) => {
  const [contact] = await db
    .insert(contactTable)
    .values({ userId, name, email, message })
    .returning({ id: usersTable.id });

  return contact;
};

//* clearUserSession
export const clearUserSession = async (sessionId) => {
  return await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
};

//* getSubscriptionData
export const SubscriptionData = async () => {
  return await db.select().from(subscriptionTable);
};

//* memberExists
export const memberExists = async ({ userId }) => {
  const [data] = await db
    .select()
    .from(membershipTable)
    .where(eq(membershipTable.userId, userId));
  return data;
};

//* createMembershipData
export const createMembershipData = async ({
  userId,
  month,
  days,
  startDate,
  expiryDate,
  price,
}) => {
  const [membership] = await db
    .insert(membershipTable)
    .values({ userId, month, days, startDate, expiryDate, price })
    .returning({ id: usersTable.id });
  return membership;
};

//* personalDetailsExist
export const personalDetailsExist = async ({ userId }) => {
  const [data] = await db
    .select()
    .from(personalDetailsTable)
    .where(eq(personalDetailsTable.userId, userId));
  return data;
};

//* createMemberDetails
export const createMemberDetails = async ({
  userId,
  fullName,
  email,
  phone,
  address,
  city,
  pinCode,
  state,
}) => {
  const [details] = await db
    .insert(personalDetailsTable)
    .values({ userId, fullName, email, phone, address, city, pinCode, state })
    .returning({ id: usersTable.id });
  return details;
};

//* userExists
export const userExists = async ({ id }) => {
  const [data] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id));
  return data;
};

//* getUsersAllData
export const getUsersAllData = async ({ userId }) => {
  const [data] = await db
    .select({
      fullName: personalDetailsTable.fullName,
      email: personalDetailsTable.email,
      phone: personalDetailsTable.phone,
      address: personalDetailsTable.address,
      city: personalDetailsTable.city,
      state: personalDetailsTable.state,
      pinCode: personalDetailsTable.pinCode,
      plan: membershipTable.month,
      price: membershipTable.price,
      days: membershipTable.days,
      startDate: membershipTable.startDate,
      expiryDate: membershipTable.expiryDate,
    })
    .from(personalDetailsTable)
    .where(eq(personalDetailsTable.userId, userId))
    .leftJoin(
      membershipTable,
      eq(membershipTable.userId, personalDetailsTable.userId),
    );
  return data;
};

//* getPaymentData
export const getPaymentData = async ({ userId }) => {
  const [data] = await db
    .select()
    .from(paymentTable)
    .where(eq(paymentTable.userId, userId));
  return data;
};

//* checkMembershipPlan
export const getMembershipData = async ({ userId }) => {
  const [data] = await db
    .select()
    .from(membershipTable)
    .where(
      and(
        eq(membershipTable.userId, userId),
        lt(membershipTable.expiryDate, sql`CURRENT_DATE`),
      ),
    );
  return data;
};

//* deleteMembershipData
export const checkMemberShipData = async ({ userId }) => {
  return await db
    .delete(membershipTable)
    .where(eq(membershipTable.userId, userId));
};

//* deletePersonalDetails
export const deletepersonaldetails = async ({ userId }) => {
  return await db
    .delete(personalDetailsTable)
    .where(eq(personalDetailsTable.userId, userId));
};

//* insertPaymentId
export const insertPaymentId = async ({ paymentId, fullName, userId }) => {
  const [data] = await db
    .insert(paymentTable)
    .values({ paymentId, fullName, userId })
    .returning({ id: usersTable.id });
  return data;
};

export const getPersonalDetailsByUserId = async (userId) => {
  try {
    const result = await db
      .select()
      .from(personalDetailsTable)
      .where(eq(personalDetailsTable.userId, userId))
      .limit(1);

    return result[0]; // return single object
  } catch (error) {
    console.error("Error fetching personal details:", error);
    throw error;
  }
};

//* updatePersonalDetails
export const updatePersonaldetails = async ({
  fullName,
  email,
  phone,
  address,
  city,
  pinCode,
  state,
  userId,
}) => {
  return await db
    .update(personalDetailsTable)
    .set({ fullName, email, phone, address, city, pinCode, state })
    .where(eq(personalDetailsTable.userId, userId));
};

//* findUserById
export const findUserById = async (userId) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user;
};

//* updateNewPassword
export const updateNewPassword = async ({ userId, newPassword }) => {
  const hashPassword = await hashedPassword(newPassword);
  return await db
    .update(usersTable)
    .set({ password: hashPassword })
    .where(eq(usersTable.id, userId));
};

//* getUserWithOauthId
// export const getUserWithOuthId = async ({ provider, email }) => {
//   const [user] = await db
//     .select({
//       id: usersTable.id,
//       name: usersTable.userName,
//       email: usersTable.email,
//       isEmailValid: usersTable.isEmailValid,
//       provider: oauthAccountsTable.provider,
//       providerAccountId: oauthAccountsTable.providerAccountId,
//     })
//     .from(usersTable)
//     .where(eq(usersTable.email, email))
//     .leftJoin(
//       oauthAccountsTable,
//       and(
//         eq(oauthAccountsTable.provider, provider),
//         eq(oauthAccountsTable.userId, usersTable.id),
//       ),
//     );
//   return user;
// };

export const getUserWithOuthId = async ({ provider, email }) => {
  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.userName,
      email: usersTable.email,
      isEmailValid: usersTable.isEmailValid,
      provider: oauthAccountsTable.provider,
      providerAccountId: oauthAccountsTable.providerAccountId,
    })
    .from(usersTable)
    .leftJoin(
      oauthAccountsTable,
      eq(oauthAccountsTable.userId, usersTable.id), // ✅ join only on relation
    )
    .where(eq(usersTable.email, email));

  return user;
};

//* linkUserWithAuth
export const linkUserwithAuth = async ({
  userId,
  provider,
  providerAccountId,
}) => {
  const existing = await db
    .select()
    .from(oauthAccountsTable)
    .where(
      and(
        eq(oauthAccountsTable.provider, provider),
        eq(oauthAccountsTable.providerAccountId, providerAccountId),
      ),
    );

  if (existing.length === 0) {
    await db.insert(oauthAccountsTable).values({
      userId,
      provider,
      providerAccountId,
    });
  }
};

//* createUserWithOauth
// export const createUserWithOuth = async ({
//   userName,
//   email,
//   provider,
//   providerAccountId,
// }) => {
//   const user = await db.transaction(async (trx) => {
//     const [user] = await trx
//       .insert(usersTable)
//       .values({ userName, email, isEmailValid: true })
//       .returning({ id: usersTable.id });

//     await trx
//       .insert(oauthAccountsTable)
//       .values({ provider, providerAccountId, userId: user.id });

//     return {
//       id: user.id,
//       userName,
//       email,
//       isEmailValid: true,
//       provider,
//       providerAccountId,
//     };
//   });

//   return user;
// };

export const createUserWithOuth = async ({
  userName,
  email,
  provider,
  providerAccountId,
}) => {
  try {
    const user = await db.transaction(async (trx) => {
      // ✅ check existing email
      const [existingUser] = await trx
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (existingUser) {
        return existingUser; // prevent duplicate
      }

      const [newUser] = await trx
        .insert(usersTable)
        .values({
          userName,
          email,
          isEmailValid: true,
        })
        .returning({ id: usersTable.id });

      await trx.insert(oauthAccountsTable).values({
        provider,
        providerAccountId,
        userId: newUser.id,
      });

      return {
        id: newUser.id,
        userName,
        email,
        isEmailValid: true,
        provider,
        providerAccountId,
      };
    });

    return user;
  } catch (error) {
    console.error("Create OAuth user error:", error);
    throw new Error("User creation failed");
  }
};
