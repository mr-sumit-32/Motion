import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  email: string;
  firstName?: string;
}

export function useUserDirectory() {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    let isMounted = true;

    getDocs(collection(db, 'users'))
      .then((snapshot) => {
        if (!isMounted) return;
        setUsers(snapshot.docs
          .map((userDoc) => {
            const data = userDoc.data();
            return { email: data.email, firstName: data.firstName };
          })
          .filter((profile) => Boolean(profile.email)));
      })
      .catch((error) => {
        console.error('Could not fetch user directory:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getDisplayName = (email: string | null | undefined) => {
    if (!email) return '';
    const profile = users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
    return profile?.firstName?.trim() || email.trim();
  };

  const getDisplayNames = (emails: string | null | undefined) => {
    if (!emails) return '';
    return emails.split(',').map((email) => getDisplayName(email)).filter(Boolean).join(', ');
  };

  return { getDisplayName, getDisplayNames };
}
