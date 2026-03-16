const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, cookieOptions);
};

export const clearAuthCookie = (res) => {
  res.clearCookie("token", cookieOptions);
};
