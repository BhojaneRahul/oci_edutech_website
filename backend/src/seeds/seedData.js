import "../config/env.js";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";

const run = async () => {
  await prisma.messageReaction.deleteMany();
  await prisma.communityMessage.deleteMany();
  await prisma.teacherVerification.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.testAttempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.studyProgress.deleteMany();
  await prisma.userActivity.deleteMany();
  await prisma.userStreak.deleteMany();
  await prisma.userXp.deleteMany();
  await prisma.likedDocument.deleteMany();
  await prisma.savedDocument.deleteMany();
  await prisma.note.deleteMany();
  await prisma.mockTest.deleteMany();
  await prisma.project.deleteMany();
  await prisma.document.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.degree.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.communityGroup.deleteMany();

  const communityGroups = await prisma.communityGroup.createMany({
    data: [
      { name: "BCA Community", slug: "bca-community", description: "Degree-level discussion for BCA learners." },
      { name: "BBA Community", slug: "bba-community", description: "Business administration student hub." },
      { name: "BA Community", slug: "ba-community", description: "Arts and humanities study community." },
      { name: "BSc Community", slug: "bsc-community", description: "Science degree discussion space." },
      { name: "B.Com Community", slug: "bcom-community", description: "Commerce student group." },
      { name: "1st PUC", slug: "1st-puc", description: "First PUC student community." },
      { name: "2nd PUC", slug: "2nd-puc", description: "Second PUC student community." }
    ]
  });

  const bcaCommunity = await prisma.communityGroup.findUnique({
    where: { slug: "bca-community" }
  });

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
      description: "Practice computer basics, logic, and introductory programming concepts in a strict timed format.",
      degreeId: bca.id,
      stream: "BCA",
      subject: "Computer Fundamentals",
      durationMinutes: 15,
      difficulty: "easy",
      questions: {
        create: [
          {
            orderIndex: 1,
            questionText: "What does CPU stand for?",
            optionA: "Central Process Unit",
            optionB: "Central Processing Unit",
            optionC: "Computer Personal Unit",
            optionD: "Central Program Utility",
            correctAnswer: "B"
          },
          {
            orderIndex: 2,
            questionText: "Which data type stores true or false values?",
            optionA: "String",
            optionB: "Integer",
            optionC: "Boolean",
            optionD: "Float",
            correctAnswer: "C"
          },
          {
            orderIndex: 3,
            questionText: "Which symbol is used to end a C statement?",
            optionA: ".",
            optionB: ",",
            optionC: ":",
            optionD: ";",
            correctAnswer: "D"
          },
          {
            orderIndex: 4,
            questionText: "Which device is primarily used to input text?",
            optionA: "Monitor",
            optionB: "Keyboard",
            optionC: "Speaker",
            optionD: "Printer",
            correctAnswer: "B"
          },
          {
            orderIndex: 5,
            questionText: "Which memory is temporary and clears when power is off?",
            optionA: "ROM",
            optionB: "Hard Disk",
            optionC: "RAM",
            optionD: "SSD",
            correctAnswer: "C"
          }
        ]
      }
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
      role: "admin",
      communityGroupId: bcaCommunity?.id
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
  console.log(`Created community groups: ${communityGroups.count}`);
  console.log(`Created degree IDs: BCA=${bca.id}, B.Com=${bcom.id}, BSc=${bsc.id}, BA=${ba.id}, BBA=${bba.id}`);
  console.log(`Created subject IDs: Programming in C=${cSubject.id}, Data Structures=${dataStructures.id}, Physics=${physics.id}, Mathematics=${mathematics.id}`);
  await prisma.$disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
