"use client"
// import { StyleSheet } from "react-native"
import { useAuth } from "@/context/AuthContext"
// import { COLORS } from "@/utils/constants"
import ProfileScreen from "../screens/ProfileScreen"
import AuthScreen from "../screens/AuthScreen"

export default function Profile() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <ProfileScreen /> : <AuthScreen />
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   header: {
//     padding: 20,
//     paddingTop: 60,
//   },
//   headerTitle: {
//     fontSize: 28,
//     fontWeight: "bold",
//     color: COLORS.text,
//   },
//   unauthenticatedContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   unauthenticatedTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: COLORS.text,
//     marginTop: 20,
//     marginBottom: 12,
//   },
//   unauthenticatedSubtitle: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//     textAlign: "center",
//     lineHeight: 24,
//     marginBottom: 32,
//   },
//   signInButton: {
//     backgroundColor: COLORS.primary,
//     paddingHorizontal: 32,
//     paddingVertical: 16,
//     borderRadius: 12,
//   },
//   signInButtonText: {
//     color: "white",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   userSection: {
//     alignItems: "center",
//     padding: 20,
//     backgroundColor: COLORS.card,
//     marginHorizontal: 20,
//     borderRadius: 16,
//     marginBottom: 20,
//   },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginBottom: 16,
//   },
//   userName: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: COLORS.text,
//     marginBottom: 4,
//   },
//   userEmail: {
//     fontSize: 14,
//     color: COLORS.textSecondary,
//   },
//   menuSection: {
//     backgroundColor: COLORS.card,
//     marginHorizontal: 20,
//     borderRadius: 16,
//     marginBottom: 20,
//   },
//   menuItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.background,
//   },
//   menuItemText: {
//     flex: 1,
//     fontSize: 16,
//     color: COLORS.text,
//     marginLeft: 12,
//   },
//   signOutSection: {
//     marginHorizontal: 20,
//     marginBottom: 40,
//   },
//   signOutButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: COLORS.card,
//     padding: 16,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#ef4444",
//   },
//   signOutButtonText: {
//     fontSize: 16,
//     color: "#ef4444",
//     marginLeft: 8,
//     fontWeight: "600",
//   },
// })
