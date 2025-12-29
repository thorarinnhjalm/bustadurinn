// Quick diagnostic script to check house ownership
// Run this in browser console on your production site

(async () => {
    const { db } = await import('./src/lib/firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('app-store') || '{}')?.state?.currentUser;

    if (!currentUser) {
        console.error('❌ No user logged in');
        return;
    }

    console.log('👤 Current User:', {
        uid: currentUser.uid,
        email: currentUser.email,
        name: currentUser.name
    });

    // Get houses
    const housesRef = collection(db, 'houses');
    const q = query(housesRef, where('owner_ids', 'array-contains', currentUser.uid));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
        const house = doc.data();
        console.log('\n🏠 House:', {
            id: doc.id,
            name: house.name,
            address: house.address,
            manager_id: house.manager_id,
            owner_ids: house.owner_ids,
            isYouManager: house.manager_id === currentUser.uid
        });
    });
})();
