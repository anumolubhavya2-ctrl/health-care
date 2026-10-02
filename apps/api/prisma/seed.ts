import { PrismaClient, DoctorStatus, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SPECIALTIES = [
  { name: 'General Physician', slug: 'general-medicine', icon: '🩺', color: '#3B82F6', description: 'Primary care and general health consultations' },
  { name: 'Cardiologist', slug: 'cardiology', icon: '❤️', color: '#EF4444', description: 'Heart and cardiovascular system' },
  { name: 'Dermatologist', slug: 'dermatology', icon: '🧴', color: '#F59E0B', description: 'Skin, hair, and nail conditions' },
  { name: 'Neurologist', slug: 'neurology', icon: '🧠', color: '#8B5CF6', description: 'Brain and nervous system disorders' },
  { name: 'Orthopedic Surgeon', slug: 'orthopedics', icon: '🦴', color: '#10B981', description: 'Bones, joints, and musculoskeletal system' },
  { name: 'Gastroenterologist', slug: 'gastroenterology', icon: '🫁', color: '#6366F1', description: 'Digestive system and gastrointestinal tract' },
  { name: 'Pulmonologist', slug: 'pulmonology', icon: '🫀', color: '#06B6D4', description: 'Lungs and respiratory system' },
  { name: 'Ophthalmologist', slug: 'ophthalmology', icon: '👁️', color: '#84CC16', description: 'Eyes and vision' },
  { name: 'ENT Specialist', slug: 'ent', icon: '👂', color: '#EC4899', description: 'Ear, nose, and throat' },
  { name: 'Endocrinologist', slug: 'endocrinology', icon: '⚗️', color: '#F97316', description: 'Hormones and metabolic disorders' },
  { name: 'Nephrologist', slug: 'nephrology', icon: '🫘', color: '#14B8A6', description: 'Kidneys and urinary tract' },
  { name: 'Gynecologist', slug: 'gynecology', icon: '👶', color: '#DB2777', description: 'Female reproductive health' },
  { name: 'Pediatrician', slug: 'pediatrics', icon: '🧒', color: '#F59E0B', description: 'Children\'s health and development' },
  { name: 'Psychiatrist', slug: 'psychiatry', icon: '🧩', color: '#7C3AED', description: 'Mental health and behavioral disorders' },
  { name: 'Oncologist', slug: 'oncology', icon: '🎗️', color: '#DC2626', description: 'Cancer diagnosis and treatment' },
];

const DOCTORS = [
  {
    email: 'dr.priya.sharma@caresync.health',
    firstName: 'Priya',
    lastName: 'Sharma',
    gender: Gender.FEMALE,
    specialty: 'cardiology',
    experience: 12,
    fee: 800,
    city: 'Mumbai',
    clinic: 'Apollo Heart Clinic',
    status: DoctorStatus.AVAILABLE,
    rating: 4.8,
    bio: 'Senior Cardiologist with expertise in interventional cardiology and heart failure management.',
    qualifications: ['MBBS', 'MD (Cardiology)', 'DM (Cardiology)', 'FACC'],
    languages: ['English', 'Hindi', 'Marathi'],
  },
  {
    email: 'dr.arjun.mehta@caresync.health',
    firstName: 'Arjun',
    lastName: 'Mehta',
    gender: Gender.MALE,
    specialty: 'dermatology',
    experience: 8,
    fee: 600,
    city: 'Bangalore',
    clinic: 'SkinCare Derma Center',
    status: DoctorStatus.AVAILABLE,
    rating: 4.6,
    bio: 'Dermatologist specializing in cosmetic dermatology, acne treatment, and skin allergies.',
    qualifications: ['MBBS', 'MD (Dermatology)', 'DVD'],
    languages: ['English', 'Hindi', 'Kannada'],
  },
  {
    email: 'dr.neha.kapoor@caresync.health',
    firstName: 'Neha',
    lastName: 'Kapoor',
    gender: Gender.FEMALE,
    specialty: 'neurology',
    experience: 15,
    fee: 1000,
    city: 'Delhi',
    clinic: 'NeuroPlus Hospital',
    status: DoctorStatus.BUSY,
    statusMessage: 'Currently in consultation',
    rating: 4.9,
    bio: 'Neurologist with expertise in epilepsy, stroke, and movement disorders.',
    qualifications: ['MBBS', 'MD (Medicine)', 'DM (Neurology)'],
    languages: ['English', 'Hindi', 'Punjabi'],
  },
  {
    email: 'dr.rajesh.nair@caresync.health',
    firstName: 'Rajesh',
    lastName: 'Nair',
    gender: Gender.MALE,
    specialty: 'orthopedics',
    experience: 10,
    fee: 700,
    city: 'Chennai',
    clinic: 'OrthoPlus Bone & Joint',
    status: DoctorStatus.AVAILABLE,
    rating: 4.5,
    bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries.',
    qualifications: ['MBBS', 'MS (Orthopaedics)', 'MCh (Ortho)'],
    languages: ['English', 'Hindi', 'Tamil'],
  },
  {
    email: 'dr.sunita.rao@caresync.health',
    firstName: 'Sunita',
    lastName: 'Rao',
    gender: Gender.FEMALE,
    specialty: 'gastroenterology',
    experience: 9,
    fee: 750,
    city: 'Hyderabad',
    clinic: 'GastroHeal Clinic',
    status: DoctorStatus.DELAYED,
    statusMessage: 'Running 20 minutes behind schedule',
    delayMinutes: 20,
    rating: 4.7,
    bio: 'Gastroenterologist with expertise in endoscopy, IBD, and liver disorders.',
    qualifications: ['MBBS', 'MD (Medicine)', 'DM (Gastroenterology)'],
    languages: ['English', 'Hindi', 'Telugu'],
  },
  {
    email: 'dr.vikram.singh@caresync.health',
    firstName: 'Vikram',
    lastName: 'Singh',
    gender: Gender.MALE,
    specialty: 'general-medicine',
    experience: 6,
    fee: 400,
    city: 'Mumbai',
    clinic: 'CityMed General Hospital',
    status: DoctorStatus.AVAILABLE,
    rating: 4.4,
    bio: 'General physician providing comprehensive primary care for all age groups.',
    qualifications: ['MBBS', 'MD (General Medicine)'],
    languages: ['English', 'Hindi', 'Gujarati'],
  },
  {
    email: 'dr.ananya.krishnan@caresync.health',
    firstName: 'Ananya',
    lastName: 'Krishnan',
    gender: Gender.FEMALE,
    specialty: 'gynecology',
    experience: 11,
    fee: 900,
    city: 'Bangalore',
    clinic: 'WomenCare Hospital',
    status: DoctorStatus.AVAILABLE,
    rating: 4.8,
    bio: 'Obstetrician and gynecologist specializing in high-risk pregnancies and laparoscopic surgery.',
    qualifications: ['MBBS', 'MS (OB-GYN)', 'FRCOG'],
    languages: ['English', 'Hindi', 'Kannada', 'Tamil'],
  },
  {
    email: 'dr.rohan.gupta@caresync.health',
    firstName: 'Rohan',
    lastName: 'Gupta',
    gender: Gender.MALE,
    specialty: 'pediatrics',
    experience: 7,
    fee: 500,
    city: 'Pune',
    clinic: 'KidsCare Pediatric Center',
    status: DoctorStatus.ON_LEAVE,
    statusMessage: 'On leave until Oct 5',
    rating: 4.7,
    bio: 'Pediatrician with special interest in pediatric nutrition and developmental disorders.',
    qualifications: ['MBBS', 'MD (Pediatrics)', 'DCH'],
    languages: ['English', 'Hindi', 'Marathi'],
  },
  {
    email: 'dr.kavitha.pillai@caresync.health',
    firstName: 'Kavitha',
    lastName: 'Pillai',
    gender: Gender.FEMALE,
    specialty: 'ophthalmology',
    experience: 13,
    fee: 650,
    city: 'Kochi',
    clinic: 'VisionClear Eye Hospital',
    status: DoctorStatus.AVAILABLE,
    rating: 4.9,
    bio: 'Ophthalmologist specializing in cataract surgery, LASIK, and retinal disorders.',
    qualifications: ['MBBS', 'MS (Ophthalmology)', 'FICO'],
    languages: ['English', 'Malayalam', 'Hindi'],
  },
  {
    email: 'dr.aditya.joshi@caresync.health',
    firstName: 'Aditya',
    lastName: 'Joshi',
    gender: Gender.MALE,
    specialty: 'psychiatry',
    experience: 9,
    fee: 850,
    city: 'Delhi',
    clinic: 'MindWell Psychiatric Center',
    status: DoctorStatus.AVAILABLE,
    rating: 4.6,
    bio: 'Psychiatrist with expertise in mood disorders, anxiety, and addiction treatment.',
    qualifications: ['MBBS', 'MD (Psychiatry)', 'DPM'],
    languages: ['English', 'Hindi'],
  },
  {
    email: 'dr.meera.chandran@caresync.health',
    firstName: 'Meera',
    lastName: 'Chandran',
    gender: Gender.FEMALE,
    specialty: 'endocrinology',
    experience: 10,
    fee: 800,
    city: 'Chennai',
    clinic: 'DiabetaCare Center',
    status: DoctorStatus.AVAILABLE,
    rating: 4.7,
    bio: 'Endocrinologist specializing in diabetes, thyroid disorders, and hormone imbalances.',
    qualifications: ['MBBS', 'MD (Medicine)', 'DM (Endocrinology)'],
    languages: ['English', 'Tamil', 'Hindi'],
  },
  {
    email: 'dr.sanjay.verma@caresync.health',
    firstName: 'Sanjay',
    lastName: 'Verma',
    gender: Gender.MALE,
    specialty: 'ent',
    experience: 14,
    fee: 600,
    city: 'Lucknow',
    clinic: 'ENT Excellence Clinic',
    status: DoctorStatus.IN_CONSULTATION,
    rating: 4.5,
    bio: 'ENT specialist with expertise in sinus surgery, hearing loss treatment, and voice disorders.',
    qualifications: ['MBBS', 'MS (ENT)', 'DLORCS'],
    languages: ['English', 'Hindi', 'Urdu'],
  },
];

async function main() {
  console.log('🌱 Starting CareSync database seed...');

  // Clear existing data (in dev)
  console.log('🗑️  Clearing existing data...');
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.doctorStatusLog.deleteMany();
  await prisma.doctorSpecialty.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.symptomMapping.deleteMany();
  await prisma.specialty.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Data cleared');

  // ============================================================
  // Specialties
  // ============================================================
  console.log('📋 Creating specialties...');
  const specialtyMap: Record<string, string> = {};

  for (const spec of SPECIALTIES) {
    const created = await prisma.specialty.create({ data: spec });
    specialtyMap[spec.slug] = created.id;
  }
  console.log(`✅ Created ${SPECIALTIES.length} specialties`);

  // ============================================================
  // Admin
  // ============================================================
  console.log('👤 Creating admin...');
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@caresync.health',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isVerified: true,
      admin: {
        create: {
          firstName: 'System',
          lastName: 'Admin',
          department: 'Platform',
        },
      },
    },
  });
  console.log('✅ Admin created: admin@caresync.health / Admin@123');

  // ============================================================
  // Demo Patient
  // ============================================================
  console.log('🧑 Creating demo patient...');
  const patientPasswordHash = await bcrypt.hash('Patient@123', 12);
  await prisma.user.create({
    data: {
      email: 'patient@caresync.health',
      passwordHash: patientPasswordHash,
      role: 'PATIENT',
      phone: '9876543210',
      isVerified: true,
      patient: {
        create: {
          firstName: 'Rahul',
          lastName: 'Verma',
          gender: Gender.MALE,
          bloodGroup: 'B+',
          city: 'Mumbai',
          state: 'Maharashtra',
          dateOfBirth: new Date('1990-05-15'),
        },
      },
    },
  });
  console.log('✅ Patient created: patient@caresync.health / Patient@123');

  // ============================================================
  // Doctors
  // ============================================================
  console.log('👩‍⚕️ Creating doctors...');

  for (const doc of DOCTORS) {
    const passwordHash = await bcrypt.hash('Doctor@123', 12);

    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash,
        role: 'DOCTOR',
        isVerified: true,
        doctor: {
          create: {
            firstName: doc.firstName,
            lastName: doc.lastName,
            gender: doc.gender,
            experience: doc.experience,
            consultationFee: doc.fee,
            status: doc.status,
            statusMessage: (doc as { statusMessage?: string }).statusMessage,
            delayMinutes: (doc as { delayMinutes?: number }).delayMinutes,
            rating: doc.rating,
            totalReviews: Math.floor(Math.random() * 200) + 50,
            totalPatients: Math.floor(Math.random() * 2000) + 200,
            bio: doc.bio,
            qualifications: doc.qualifications,
            languages: doc.languages,
            clinicName: doc.clinic,
            clinicCity: doc.city,
            isVerified: true,
            isAvailableForVideo: Math.random() > 0.5,
            isAvailableForPhone: Math.random() > 0.5,
          },
        },
      },
      include: { doctor: true },
    });

    const doctor = user.doctor!;

    // Add specialty
    const specialtyId = specialtyMap[doc.specialty];
    if (specialtyId) {
      await prisma.doctorSpecialty.create({
        data: {
          doctorId: doctor.id,
          specialtyId,
          isPrimary: true,
        },
      });
    }

    // Add availabilities (Mon-Fri)
    for (let day = 1; day <= 5; day++) {
      await prisma.availability.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
          isActive: true,
        },
      });
    }

    // Create queue for available doctors
    if (doc.status === DoctorStatus.AVAILABLE || doc.status === DoctorStatus.BUSY) {
      await prisma.queue.create({
        data: {
          doctorId: doctor.id,
          currentToken: Math.floor(Math.random() * 5),
          totalTokens: Math.floor(Math.random() * 10) + 3,
          avgWaitMinutes: 15,
          isActive: true,
        },
      });
    }
  }

  console.log(`✅ Created ${DOCTORS.length} doctors`);

  // ============================================================
  // Symptom mappings
  // ============================================================
  console.log('🔬 Creating symptom mappings...');
  const symptomData = [
    { symptom: 'Chest Pain', keywords: ['chest pain', 'heart pain', 'angina'], specialtySlug: 'cardiology', reason: 'Chest pain may indicate a cardiac condition' },
    { symptom: 'Skin Rash', keywords: ['skin rash', 'itching', 'eczema'], specialtySlug: 'dermatology', reason: 'Skin symptoms require dermatological evaluation' },
    { symptom: 'Headache', keywords: ['headache', 'migraine', 'head pain'], specialtySlug: 'neurology', reason: 'Persistent headaches may have neurological causes' },
    { symptom: 'Joint Pain', keywords: ['joint pain', 'bone pain', 'arthritis'], specialtySlug: 'orthopedics', reason: 'Joint and bone pain requires orthopedic evaluation' },
    { symptom: 'Stomach Pain', keywords: ['stomach pain', 'abdominal pain', 'gastric'], specialtySlug: 'gastroenterology', reason: 'Digestive issues require gastroenterological care' },
    { symptom: 'Breathing Difficulty', keywords: ['breathing difficulty', 'shortness of breath', 'cough'], specialtySlug: 'pulmonology', reason: 'Respiratory symptoms need pulmonologist evaluation' },
    { symptom: 'Eye Problems', keywords: ['eye pain', 'blurred vision', 'eye irritation'], specialtySlug: 'ophthalmology', reason: 'Eye conditions require ophthalmological evaluation' },
    { symptom: 'Ear/Throat Problems', keywords: ['ear pain', 'sore throat', 'nasal blockage'], specialtySlug: 'ent', reason: 'ENT issues require specialized evaluation' },
    { symptom: 'Diabetes/Thyroid', keywords: ['diabetes', 'thyroid', 'weight gain'], specialtySlug: 'endocrinology', reason: 'Metabolic disorders require endocrinological care' },
    { symptom: 'Mental Health', keywords: ['anxiety', 'depression', 'stress'], specialtySlug: 'psychiatry', reason: 'Mental health requires psychiatric evaluation' },
  ];

  for (const s of symptomData) {
    const specialtyId = specialtyMap[s.specialtySlug];
    if (specialtyId) {
      await prisma.symptomMapping.create({
        data: {
          symptom: s.symptom,
          keywords: s.keywords,
          specialtyId,
          reason: s.reason,
          confidence: 0.85,
        },
      });
    }
  }

  console.log('✅ Symptom mappings created');
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Admin:   admin@caresync.health / Admin@123');
  console.log('   Patient: patient@caresync.health / Patient@123');
  console.log('   Doctor:  dr.priya.sharma@caresync.health / Doctor@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
