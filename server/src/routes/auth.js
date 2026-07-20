import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { signToken, authRequired } from "../auth.js";
import { publicUser } from "../serializers.js";

export const authRouter = Router();

authRouter.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  // Emails are stored lowercased, so normalize the input for a case-insensitive match.
  const user = await prisma.user.findUnique({
    where: { email: String(email || "").trim().toLowerCase() },
    include: { flat: true },
  });
  if (!user || !user.active || !(await bcrypt.compare(password || "", user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get("/me", authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { flat: true },
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
});

// Register the device's Expo push token so we can notify this user.
authRouter.post("/push-token", authRequired, async (req, res) => {
  const { token } = req.body || {};
  await prisma.user.update({
    where: { id: req.user.id },
    data: { expoPushToken: token || null },
  });
  res.json({ ok: true });
});

// Flat list for pickers (guards choose a flat when logging a visitor).
authRouter.get("/flats", authRequired, async (_req, res) => {
  const flats = await prisma.flat.findMany({ orderBy: { flatNo: "asc" } });
  res.json({ flats: flats.map((f) => ({ id: f.id, flatNo: f.flatNo, block: f.block })) });
});

// Non-sensitive society payee info so residents can see where maintenance goes.
authRouter.get("/bank-account", authRequired, async (_req, res) => {
  const account = await prisma.societyAccount.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account || !account.active) return res.json({ account: null });
  const acct = account.accountNumber || "";
  res.json({
    account: {
      accountHolderName: account.accountHolderName,
      bankName: account.bankName,
      last4: acct ? acct.slice(-4) : null,
      upiId: account.upiId,
      routed: Boolean(account.razorpayAccountId),
    },
  });
});
