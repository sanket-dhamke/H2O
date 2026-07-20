import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import { placeholderPhoto } from "./storage.js";

// Seeds a demo society: flats, multiple residents/guards/admins, bills and a
// visitor history so every screen looks populated. Password for all: Password123
const PASSWORD = "Password123";

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

async function main() {
  const hash = bcrypt.hashSync(PASSWORD, 10);

  // Wipe existing data (order matters for FK constraints).
  await prisma.visitor.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.user.deleteMany();
  await prisma.flat.deleteMany();

  // Flats
  const flatA101 = await prisma.flat.create({
    data: { flatNo: "A-101", block: "A", ownerName: "Aarav Sharma" },
  });
  const flatA102 = await prisma.flat.create({
    data: { flatNo: "A-102", block: "A", ownerName: "Diya Mehta" },
  });
  const flatB201 = await prisma.flat.create({
    data: { flatNo: "B-201", block: "B", ownerName: "Rohan Kapoor" },
  });

  // Admins (multiple allowed)
  await prisma.user.createMany({
    data: [
      { name: "Society Admin", email: "admin@h2o.com", role: "admin", passwordHash: hash, phone: "99999 00001" },
      { name: "Committee Head", email: "admin2@h2o.com", role: "admin", passwordHash: hash, phone: "99999 00002" },
    ],
  });

  // Guards (multiple)
  await prisma.user.createMany({
    data: [
      { name: "Gate Guard - Day", email: "guard@h2o.com", role: "guard", passwordHash: hash, phone: "98888 00001" },
      { name: "Gate Guard - Night", email: "guard2@h2o.com", role: "guard", passwordHash: hash, phone: "98888 00002" },
    ],
  });
  const guard = await prisma.user.findUnique({ where: { email: "guard@h2o.com" } });

  // Residents (multiple per flat to demo multi-member flats)
  await prisma.user.createMany({
    data: [
      { name: "Aarav Sharma", email: "resident@h2o.com", role: "resident", passwordHash: hash, phone: "97777 00001", flatId: flatA101.id },
      { name: "Ananya Sharma", email: "resident1b@h2o.com", role: "resident", passwordHash: hash, phone: "97777 00002", flatId: flatA101.id },
      { name: "Diya Mehta", email: "resident2@h2o.com", role: "resident", passwordHash: hash, phone: "97777 00003", flatId: flatA102.id },
      { name: "Rohan Kapoor", email: "resident3@h2o.com", role: "resident", passwordHash: hash, phone: "97777 00004", flatId: flatB201.id },
    ],
  });

  // Bills: last 3 months per flat, older ones paid, latest pending.
  const months = ["2026-05", "2026-06", "2026-07"];
  const flats = [flatA101, flatA102, flatB201];
  for (const flat of flats) {
    for (let i = 0; i < months.length; i++) {
      const period = months[i];
      const paid = i < 2;
      await prisma.bill.create({
        data: {
          flatId: flat.id,
          period,
          amount: 1, // kept at Rs.1 for easy payment testing
          dueDate: `${period}-10`,
          status: paid ? "paid" : "pending",
          paidAt: paid ? new Date() : null,
          paymentRef: paid ? `PAY-SEED${i}` : null,
        },
      });
    }
  }

  // Visitor history for flat A-101, including one pending approval.
  const seededVisitors = [
    { name: "Rahul Verma", phone: "98200 11223", purpose: "Guest", vehicleNo: "MH12AB1234", status: "pending", createdAt: hoursAgo(0.05), decidedAt: null },
    { name: "Amazon Delivery", phone: "91000 55667", purpose: "Delivery", vehicleNo: "MH14DL7788", status: "leave_at_gate", createdAt: hoursAgo(5), decidedAt: hoursAgo(4.9) },
    { name: "Priya Nair", phone: "99870 33221", purpose: "Guest", vehicleNo: null, status: "approved", createdAt: hoursAgo(26), decidedAt: hoursAgo(25.9) },
    { name: "Ola Cab Driver", phone: "98111 22334", purpose: "Cab", vehicleNo: "KA05MN4321", status: "approved", createdAt: hoursAgo(74), decidedAt: hoursAgo(73.9) },
  ];
  for (const v of seededVisitors) {
    await prisma.visitor.create({
      data: {
        flatId: flatA101.id,
        name: v.name,
        phone: v.phone,
        vehicleNo: v.vehicleNo,
        purpose: v.purpose,
        photoUrl: placeholderPhoto(v.name),
        guardId: guard?.id || null,
        status: v.status,
        createdAt: v.createdAt,
        decidedAt: v.decidedAt,
      },
    });
  }

  // A couple of society expenses so the balance is meaningful.
  await prisma.expense.createMany({
    data: [
      { label: "Lift AMC (July)", amount: 3500, date: hoursAgo(240) },
      { label: "Garden maintenance", amount: 1200, date: hoursAgo(120) },
    ],
  });

  console.log("Seed complete. All demo logins use password: " + PASSWORD);
  console.log("  admin@h2o.com / admin2@h2o.com        (admins)");
  console.log("  guard@h2o.com / guard2@h2o.com        (guards)");
  console.log("  resident@h2o.com  (A-101), resident1b@h2o.com (A-101, same flat)");
  console.log("  resident2@h2o.com (A-102), resident3@h2o.com (B-201)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
