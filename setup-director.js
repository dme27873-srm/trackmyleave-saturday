// create-director.js
// Run with: node create-director.js

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Using environment variables (recommended for production)
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const auth = admin.auth();
const db = admin.firestore();

// Configuration - CHANGE THESE VALUES
const DIRECTOR_CONFIG = {
  email: 'director@trp.srmtrichy.edu.in',
  password: 'SecurePassword123!', // Use a strong password
  name: 'Dr. Director Name',
  employeeId: 'TRPT0001',
  department: 'Administration',
};

async function createDirectorUser() {
  console.log('🚀 Starting Director User Creation...\n');
  console.log('Configuration:');
  console.log(`  Email: ${DIRECTOR_CONFIG.email}`);
  console.log(`  Name: ${DIRECTOR_CONFIG.name}`);
  console.log(`  Employee ID: ${DIRECTOR_CONFIG.employeeId}`);
  console.log(`  Department: ${DIRECTOR_CONFIG.department}`);
  console.log(`  Role: Director\n`);

  try {
    // Step 1: Check if user already exists in Firebase Auth
    console.log('🔍 Checking if user already exists in Firebase Auth...');
    let userRecord;
    let isNewUser = false;

    try {
      userRecord = await auth.getUserByEmail(DIRECTOR_CONFIG.email);
      console.log(`⚠️  User already exists in Firebase Auth with UID: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('✅ User does not exist. Creating new user...\n');
        isNewUser = true;

        // Create user in Firebase Authentication
        console.log('📝 Step 1: Creating Firebase Auth user...');
        userRecord = await auth.createUser({
          email: DIRECTOR_CONFIG.email,
          password: DIRECTOR_CONFIG.password,
          emailVerified: true,
          displayName: DIRECTOR_CONFIG.name,
        });

        console.log(`✅ Firebase Auth user created successfully!`);
        console.log(`   UID: ${userRecord.uid}`);
      } else {
        throw error;
      }
    }

    const uid = userRecord.uid;

    // Step 2: Check if Firestore document exists
    console.log('\n🔍 Checking if Firestore document exists...');
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      const existingData = userDoc.data();
      console.log(`⚠️  Firestore document already exists`);
      console.log(`   Current role: ${existingData.role}`);

      if (existingData.role === 'Director') {
        console.log('\n✅ User is already a Director. No changes needed.');
      } else {
        console.log(`\n🔄 Updating role from "${existingData.role}" to "Director"...`);
        await userDocRef.update({
          role: 'Director',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log('✅ Role updated to Director!');
      }
    } else {
      // Create Firestore document matching your schema
      console.log('📝 Step 2: Creating Firestore user document...\n');

      const userData = {
        appLockEnabled: false,
        biometricEnabled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        department: DIRECTOR_CONFIG.department,
        email: DIRECTOR_CONFIG.email,
        employeeId: DIRECTOR_CONFIG.employeeId,
        id: uid,
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        lockTimeout: 30,
        name: DIRECTOR_CONFIG.name,
        notificationsEnabled: true,
        role: 'Director', // ← CRITICAL FIELD
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await userDocRef.set(userData);
      console.log('✅ Firestore document created successfully!');
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 DIRECTOR USER SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 User Details:');
    console.log(`   UID:         ${uid}`);
    console.log(`   Email:       ${DIRECTOR_CONFIG.email}`);
    console.log(`   Password:    ${DIRECTOR_CONFIG.password}`);
    console.log(`   Name:        ${DIRECTOR_CONFIG.name}`);
    console.log(`   Employee ID: ${DIRECTOR_CONFIG.employeeId}`);
    console.log(`   Department:  ${DIRECTOR_CONFIG.department}`);
    console.log(`   Role:        Director`);
    console.log('\n✨ You can now login to the application!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📋 Full error details:');
    console.error(error);

    // Provide helpful error messages
    if (error.code === 'auth/email-already-exists') {
      console.log('\n💡 Solution: The email already exists in Firebase Auth.');
      console.log('   Either use a different email or run the script again to update the role.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 Solution: Please provide a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 Solution: Password must be at least 6 characters long.');
    } else if (error.message.includes('FIREBASE_PROJECT_ID')) {
      console.log('\n💡 Solution: Make sure your .env.local file has the correct Firebase credentials.');
      console.log('   Required variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }

    process.exit(1);
  }
}

// Run the script
createDirectorUser();

