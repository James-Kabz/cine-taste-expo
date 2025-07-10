import { useSession } from "@/hooks/useSession";
import ProfileScreen from "../screens/ProfileScreen";
import AuthScreen from "../screens/AuthScreen";


export default function Profile() {
  const { session } = useSession();
  
  return session ? <ProfileScreen /> : <AuthScreen />;
}