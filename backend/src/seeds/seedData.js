import "../config/env.js";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";

const run = async () => {
  await prisma.note.deleteMany();
  await prisma.mockTest.deleteMany();
  await prisma.project.deleteMany();
  await prisma.document.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.degree.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  const [bca, bcom, bsc, ba, bba] = await Promise.all([
    prisma.degree.create({
      data: { name: "BCA", description: "Computer applications resources", icon: "Laptop2" }
    }),
    prisma.degree.create({
      data: { name: "B.Com", description: "Commerce study materials", icon: "Calculator" }
    }),
    prisma.degree.create({
      data: { name: "BSc", description: "Science course content", icon: "FlaskConical" }
    }),
    prisma.degree.create({
      data: { name: "BA", description: "Arts and humanities resources", icon: "BookOpen" }
    }),
    prisma.degree.create({
      data: { name: "BBA", description: "Business administration library", icon: "BriefcaseBusiness" }
    })
  ]);

  const [cSubject, dataStructures, physics, mathematics] = await Promise.all([
    prisma.subject.create({
      data: { degreeId: bca.id, category: "degree", name: "Programming in C", semester: "Semester 1" }
    }),
    prisma.subject.create({
      data: { degreeId: bca.id, category: "degree", name: "Data Structures", semester: "Semester 3" }
    }),
    prisma.subject.create({
      data: { category: "puc", group: "1st PUC", name: "Physics", semester: "PUC 1" }
    }),
    prisma.subject.create({
      data: { category: "puc", group: "2nd PUC", name: "Mathematics", semester: "PUC 2" }
    })
  ]);

  await prisma.note.createMany({
    data: [
      {
        subjectId: cSubject.id,
        title: "Programming in C Unit 1 Notes",
        pdfUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        type: "notes"
      },
      {
        subjectId: cSubject.id,
        title: "Programming in C Model Question Paper",
        pdfUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        type: "model_qp"
      },
      {
        subjectId: physics.id,
        title: "1st PUC Physics Notes",
        pdfUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        type: "notes"
      }
    ]
  });

  await prisma.mockTest.create({
    data: {
      title: "BCA Fundamentals Mock Test",
      degreeId: bca.id,
      questions: [
        {
          question: "What does CPU stand for?",
          options: ["Central Process Unit", "Central Processing Unit", "Computer Personal Unit"],
          answer: "Central Processing Unit"
        }
      ]
    }
  });

  await prisma.project.create({
    data: {
      title: "Student Management System",
      description: "Full-stack academic record management project for BCA students.",
      degree: "BCA",
      downloadLink: "https://example.com/project.zip"
    }
  });

  await prisma.setting.create({
    data: {
      key: "downloadsEnabled",
      value: false
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@ociedutech.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin"
    }
  });

  await prisma.document.createMany({
    data: [
      {
        title: "Programming in C Unit 1 Notes",
        subject: "Programming in C",
        stream: "BCA",
        type: "notes",
        fileUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        uploadedBy: adminUser.id
      },
      {
        title: "Programming in C Model Question Paper",
        subject: "Programming in C",
        stream: "BCA",
        type: "model_qp",
        fileUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        uploadedBy: adminUser.id
      },
      {
        title: "1st PUC Physics Notes",
        subject: "Physics",
        stream: "1st PUC",
        type: "notes",
        fileUrl: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
        uploadedBy: adminUser.id
      }
    ]
  });

  console.log("Seed data created");
  console.log(`Created degree IDs: BCA=${bca.id}, B.Com=${bcom.id}, BSc=${bsc.id}, BA=${ba.id}, BBA=${bba.id}`);
  console.log(`Created subject IDs: Programming in C=${cSubject.id}, Data Structures=${dataStructures.id}, Physics=${physics.id}, Mathematics=${mathematics.id}`);
  await prisma.$disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
