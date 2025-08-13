// App.js
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Core screens
import LandingScreen from './screens/LandingScreen';
import RoleSelectionScreen from './screens/RoleSelectionScreen';
import FieldWorkerAuthScreen from './screens/FieldWorkerAuthScreen';
import PatientAuthScreen from './screens/PatientAuthScreen';
import AdminLoginScreen from './screens/AdminLoginScreen';
import FieldWorkerSignupScreen from './screens/FieldWorkerSignupScreen';
import PatientSignupScreen from './screens/PatientSignupScreen';
import PatientLoginScreen from './screens/PatientLoginScreen';
import AdminApprovalScreen from './screens/AdminApprovalScreen';
import FieldWorkerLoginScreen from './screens/FieldWorkerLoginScreen';
import FieldWorkerDashboardScreen from './screens/FieldWorkerDashboardScreen';
import OnboardingScreen from './screens/Onboarding';

// Add Patient multi-step flow
import AddPatientPersonalScreen from './screens/AddPatientPersonalScreen';
import AddPatientVitalsScreen from './screens/AddPatientVitalsScreen';
import AddPatientSymptomsScreen from './screens/AddPatientSymptomsScreen';
import AddPatientReviewScreen from './screens/AddPatientReviewScreen';

// Patient utilities
import VisitHistoryScreen from './screens/VisitHistoryScreen';
import EditPatientScreen from './screens/EditPatientScreen';


import PatientListScreen from './screens/PatientListScreen';
import PatientProfileScreen from './screens/PatientProfileScreen'; // create this next!
import AddVisitScreen from './screens/AddVisitScreen';
import EditVisitScreen from './screens/EditVisitScreen';


import AskAIScreen from './screens/AskAIScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerBackTitle: 'Back' }}>
        {/* Auth and role selection */}
        <Stack.Screen
          name="Landing"
          component={LandingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FieldWorkerAuth"
          component={FieldWorkerAuthScreen}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="PatientAuth"
          component={PatientAuthScreen}
          options={{ headerShown: true }}
        />
        <Stack.Screen
          name="AdminLogin"
          component={AdminLoginScreen}
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="FieldWorkerSignup"
          component={FieldWorkerSignupScreen}
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="PatientSignup"
          component={PatientSignupScreen}
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="PatientLogin"
          component={PatientLoginScreen}
          options={{ headerShown: true, headerTitle: ''}}
        />
        <Stack.Screen
          name="FieldWorkerLogin"
          component={FieldWorkerLoginScreen}
          options={{ headerShown: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="AdminApproval"
          component={AdminApprovalScreen}
          options={{ headerShown: true }}
        />

        {/* Dashboard */}
        <Stack.Screen
          name="FieldWorkerDashboard"
          component={FieldWorkerDashboardScreen}
          options={{ headerShown: true, headerTitle: '' }}
        />

        {/* Add Patient Multi-Step */}
        <Stack.Screen
          name="AddPatientPersonal"
          component={AddPatientPersonalScreen}
          options={{ title: 'Add New Patient' }}
        />
        <Stack.Screen
          name="AddPatientVitals"
          component={AddPatientVitalsScreen}
          options={{ title: 'Patient Vitals' }}
        />
        <Stack.Screen
          name="AddPatientSymptoms"
          component={AddPatientSymptomsScreen}
          options={{ title: 'Symptoms & Notes' }}
        />
        <Stack.Screen
          name="AddPatientReview"
          component={AddPatientReviewScreen}
          options={{ title: 'Review & Confirm' }}
        />

        {/* Patient Details, Visit History, Edit */}
        <Stack.Screen
          name="VisitHistory"
          component={VisitHistoryScreen}
          options={{ title: 'Visit History' }}
        />
        <Stack.Screen
          name="EditPatient"
          component={EditPatientScreen}
          options={{ title: 'Edit Patient' }}
        />
        <Stack.Screen
          name="PatientList"
          component={PatientListScreen}
          options={{ title: 'Patient List' }}
        />
        <Stack.Screen
          name="PatientProfile"
          component={PatientProfileScreen}
          options={{ title: 'Patient Profile' }}
        />
        <Stack.Screen
          name="AddVisit"
          component={AddVisitScreen}
          options={{ title: 'Add Visit' }}
        />
        <Stack.Screen
          name="EditVisit"
          component={EditVisitScreen}
          options={{ title: 'Edit Visit', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="AskAI"
          component={AskAIScreen}
          options={{ title: 'Ask AI', headerBackTitle: 'Back' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
