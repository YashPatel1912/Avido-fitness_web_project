import Stripe from "stripe";
import { ZodError } from "zod";

const stripe = new Stripe(process.env.STRIPE_API_KEY);

import { generateState, generateCodeVerifier, decodeIdToken } from "arctic";

import { OAUTH_EXCHANGE_EXPIRY } from "../config/constant.js";

import {
  authenticationUser,
  clearUserSession,
  comparePassword,
  createMemberDetails,
  createMembershipData,
  createUser,
  verifyUserbyEmail,
  hashedPassword,
  insertContactData,
  memberExists,
  personalDetailsExist,
  SubscriptionData,
  verifyJWTToken,
  userExists,
  getUsersAllData,
  insertPaymentId,
  getPaymentData,
  updatePersonaldetails,
  findUserById,
  updateNewPassword,
  getUserWithOuthId,
  linkUserwithAuth,
  createUserWithOuth,
  getPersonalDetailsByUserId,
} from "../services/authServices.js";
import {
  changePassword,
  contactSchema,
  forgotPasswordSchema,
  loginSchema,
  personalDetailsSchema,
  registerSchema,
  resetPasswordSchema,
  setPasswordSchema,
} from "../validators/authValidation.js";
import { google } from "../lib/oauth/google.js";

export const getBackendPage = (req, res) => {
  res.send("Backend is running ");
};

// todo postRegisterData
export const postRegisterData = async (req, res) => {
  const data = registerSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { userName, email, password } = data.data;

  const userExists = await verifyUserbyEmail(email);

  if (userExists) {
    res.status(400).json({ message: "User already exists." });
    return;
  }

  const hashPassword = await hashedPassword(password);

  const [user] = await createUser({ userName, email, password: hashPassword });

  await authenticationUser({ user, userName, email, req, res });

  res.json({
    success: true,
    message: "User compltely registered and logged in successfully.",
  });
};

// todo postLoginData
export const postLoginData = async (req, res) => {
  const data = loginSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { email, password } = data.data;

  const user = await verifyUserbyEmail(email);

  if (!user) {
    res.status(400).json({ message: ["User is not authenticated."] });
    return;
  }

  const verifyPassword = await comparePassword(user.password, password);

  if (!verifyPassword) {
    res.status(400).json({ message: ["Invalid credentials."] });
    return;
  }

  const token = await authenticationUser({ user, req, res });

  res.json({ success: true, message: "User is logged in successfully." });
};

// todo checkAuthData
export const checkAuthData = async (req, res) => {
  res.json({ message: "This is protected ", user: req.user });
};

// todo LogoutUser
export const logoutUser = async (req, res) => {
  await clearUserSession(req.user.sessionId);

  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.json({ success: true, message: "You have logged out successfully." });
};

// todo postContactData
export const postContactData = async (req, res) => {
  const data = contactSchema.safeParse(req.body);
  console.log(data);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { name, email, message } = data.data;

  const user = await verifyUserbyEmail(email);

  if (!user) {
    res.status(400).json({ message: "Invalid Creadentials." });
    return;
  }

  const contactId = await insertContactData({
    userId: user.id,
    name,
    email,
    message,
  });

  res.json({
    success: true,
    message: "Your message has been received. We will get back to you shortly.",
  });
};

// todo getSubscriptionData
export const getSubscriptionData = async (req, res) => {
  const data = await SubscriptionData();

  if (!data) {
    return res.status(400).json({ message: "Subscription data not found." });
  }

  return res.json({ sucess: true, message: "subscription data", data: data });
};

// todo postMembershipData
export const postMembershipData = async (req, res) => {
  const { month, days, price } = req.body;

  if (!req.body) {
    res.status(400).json({ error: "Request body is missing." });
  }

  const memberExist = await memberExists({ userId: req.user.id });

  if (memberExist) {
    return res
      .status(400)
      .json({ error: "You have already subscribed to a membership plan." });
  }

  const startdate = new Date();
  const expirydate = new Date();
  expirydate.setDate(startdate.getDate() + days);

  const membershipData = await createMembershipData({
    userId: req.user.id,
    month: month,
    days: days,
    startDate: startdate,
    expiryDate: expirydate,
    price: price,
  });

  res.json({
    success: true,
    message: "Membership plan activated successfully.",
    insertId: membershipData,
  });
};

// todo postPersonalDetails
export const postPersonalDetails = async (req, res) => {
  const data = personalDetailsSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);

    return res.status(400).json({ errors: errorMessage });
  }

  const { fullName, email, phone, address, city, pinCode, state } = data.data;

  const userExist = await personalDetailsExist({ userId: req.user.id });
  if (userExist) {
    return res
      .status(400)
      .json({ error: "Personal details have already been submitted." });
  }

  const emailExist = await verifyUserbyEmail(email);
  if (!emailExist) {
    return res.status(400).json({
      error:
        "No account found with this email. Please use a registered email address.",
    });
  }

  const details = await createMemberDetails({
    userId: req.user.id,
    fullName,
    email,
    phone,
    address,
    city,
    pinCode,
    state,
  });

  res.json({
    success: true,
    message: "Personal detail submitted.",
    insertId: details,
  });
};

export const postCheckOut = async (req, res) => {
  try {
    const membership = req.body;

    const price = Number(membership?.price);

    if (!price || isNaN(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price",
      });
    }

    const FRONTEND_URL =
      process.env.FRONTEND_URL || "https://avido-fitness-web-project.vercel.app";

    if (!process.env.STRIPE_API_KEY) {
      console.error("Stripe key missing in environment variables");
      return res.status(500).json({
        success: false,
        message: "Stripe configuration error",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${membership?.month || "Membership"} Plan`,
              description: `${membership?.days || 0} days access`,
            },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/failed`,
    });

    return res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
    });
  }
};

// todo GetProfilePage
export const postPaymentData = async (req, res) => {
  try {
    const { paymentId, fullName } = req.body;

    const id = await insertPaymentId({
      paymentId,
      fullName,
      userId: req.user.id,
    });

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Failed to save payment data",
      });
    }

    res.status(200).json({
      success: true,
      message: "Payment data saved successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const GetProfilePage = async (req, res) => {
  const userData = await userExists({ id: req.user.id });

  if (!userData) {
    return res.json({ message: "user is not loggedIn" });
  }

  const profileData = await getUsersAllData({ userId: userData.id });

  const paymentData = await getPaymentData({ userId: userData.id });

  const data = {
    profileData: profileData,
    userData: userData,
    paymentData: paymentData,
  };

  res.json({
    success: true,
    message: "User profile data retrieved successfully.",
    data: data,
  });
};

//! edit data pages
// todo editPersonalDetails
export const editPersonalDetails = async (req, res) => {
  const data = personalDetailsSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);

    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { fullName, email, phone, address, city, pinCode, state } = data.data;

  try {
    // ✅ 1. Get existing data from DB
    const existingUser = await getPersonalDetailsByUserId(req.user.id);

    if (!existingUser) {
      return res.status(404).json({ message: "Personal details not found." });
    }

    // ✅ 2. Check if anything changed
    const isChanged =
      existingUser.fullName !== fullName ||
      existingUser.phone !== phone ||
      existingUser.address !== address ||
      existingUser.city !== city ||
      existingUser.pinCode !== pinCode ||
      existingUser.state !== state;

    // ❌ No change → skip update
    if (!isChanged) {
      return res.status(400).json({
        success: false,
        message: "No changes detected. Personal details are up to date.",
      });
    }

    // ✅ 3. Update only if changed
    const updatedData = await updatePersonaldetails({
      fullName,
      email,
      phone,
      address,
      city,
      state,
      pinCode,
      userId: req.user.id,
    });

    return res.json({
      success: true,
      message: "Personal details updated successfully.",
      data: updatedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message:
        "An error occurred while updating personal details. Please try again later.",
    });
  }
};

// todo postChangePassword
export const postChangePassword = async (req, res) => {
  const data = changePassword.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { newPassword, confirmPassword, currentPassword } = data.data;

  const user = await findUserById(req.user.id);

  const isPassword = await comparePassword(user.password, currentPassword);

  if (!isPassword) {
    return res
      .status(400)
      .json({ message: "The current password you entered is incorrect." });
  }

  const updatePassword = await updateNewPassword({
    userId: user.id,
    newPassword,
  });

  return res.json({
    sucess: true,
    message: "Your password has been updated successfully.",
  });
};

// todo postForgotPassword
export const postForgotPassword = async (req, res) => {
  const data = forgotPasswordSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { email } = data.data;

  const user = await verifyUserbyEmail(email);

  if (!user) {
    return res
      .status(400)
      .json({ message: "No account found with this email address." });
  }

  res.json({
    success: true,
    message: "Create a new password for your account.",
    Data: user.email,
  });
};

// todo postResetPassword
export const postResetPassword = async (req, res) => {
  const data = resetPasswordSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { newPassword, confirmPassword, email } = data.data;

  const user = await verifyUserbyEmail(email);

  const isPassword = await comparePassword(user.password, newPassword);

  if (!isPassword) {
    return res.status(400).json({
      success: false,
      message: "The new password cannot be the same as the current password.",
    });
  }

  const updatePassword = await updateNewPassword({
    userId: user.id,
    newPassword,
  });

  res.json({
    success: true,
    message: "Your password has been updated successfully.",
  });
};

// todo getGooglePage
export const getGooglePage = async (req, res) => {
  if (req.user) return res.redirect("/");

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  const baseConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_EXCHANGE_EXPIRY,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  res.cookie("google_outh_state", state, baseConfig);
  res.cookie("google_code_verifier", codeVerifier, baseConfig);

  res.redirect(url.toString());
};

// todo getGoogleCallBackPage
export const PostGoogleCallBackPage = async (req, res) => {
  try {
    const { code, state } = req.body;
    console.log(req.query, "data", req.body);

    const {
      google_outh_state: storedState,
      google_code_verifier: codeVerifier,
    } = req.cookies;
    console.log(req.cookies, "cookies");

    if (
      !code ||
      !state ||
      !storedState ||
      !codeVerifier ||
      state !== storedState
    ) {
      return res.status(400).json({
        error: "Invalid Google login attempt. Please try again.",
      });
    }

    let tokens;

    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier);
    } catch (error) {
      console.error("Token validation error:", error);
      return res.status(400).json({
        error: "Google authorization failed",
      });
    }

    if (!tokens?.idToken) {
      return res.status(400).json({
        error: "Invalid token received from Google",
      });
    }

    const claims = decodeIdToken(tokens.idToken());
    const { sub: googleUserId, name, email } = claims;

    if (!email) {
      return res.status(400).json({
        error: "Email not found from Google",
      });
    }

    let user = await getUserWithOuthId({ provider: "google", email });

    if (user && !user.providerAccountId) {
      await linkUserwithAuth({
        userId: user.id,
        provider: "google",
        providerAccountId: googleUserId,
      });
    }

    // if user doesn't exists
    if (!user) {
      user = await createUserWithOuth({
        userName: name,
        email,
        provider: "google",
        providerAccountId: googleUserId,
      });
    }

    if (!user) {
      return res.status(500).json({
        error: "User creation failed",
      });
    }

    await authenticationUser({
      user,
      userName: name,
      email,
      req,
      res,
    });

    const data = await findUserById(user.id);

    if (data?.password === null) {
      return res.status(400).json({
        redirect: "/set-password",
        error: "Please set password",
        data: data.email,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
    });
  } catch (error) {
    console.error("Google callback error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

//todo postSetPasword
export const postSetPasword = async (req, res) => {
  const data = setPasswordSchema.safeParse(req.body);

  if (!data.success) {
    const errorMessage = data.error.issues[0].message;
    req.flash("errors", errorMessage);
    return res.status(400).json({ errors: req.flash("errors")[0] });
  }

  const { password, email } = data.data;

  const user = await verifyUserbyEmail(email);

  if (user) {
    const Password = await updateNewPassword({
      userId: user.id,
      newPassword: password,
    });
  }

  res.json({ success: true, message: "You have logged in successfully." });
};
