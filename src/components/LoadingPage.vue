<template>
  <div>Loading...</div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "../firebase/firebaseInit";
import { collection, getDocs } from "firebase/firestore";

onMounted(async () => {
  console.log("Fetching last update time from Updates collection...");
  // Read the last update time from the "Updates" collection
  const updatesRef = collection(db, "Updates");
  const updatesSnapshot = await getDocs(updatesRef);
  const lastUpdate = updatesSnapshot.docs.reduce(
    (acc, cur) => Math.max(acc, cur.data().timestamp),
    0,
  );
  console.log("Last update time fetched:", lastUpdate);

  console.log("Reading local storage...");
  // Read the local storage variable
  const localLastUpdate = localStorage.getItem("lastUpdate");
  const localBibliografia = localStorage.getItem("bibliografia");

  if (!localLastUpdate || lastUpdate > localLastUpdate) {
    // If this is the first boot or updates are newer than local storage, fetch the "Bibliografia" collection
    console.log(
      "First boot or updates are newer than local storage. Fetching Bibliografia...",
    );
    const bibliografiaRef = collection(db, "Bibliografia");
    const bibliografiaSnapshot = await getDocs(bibliografiaRef);
    const bibliografia = bibliografiaSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Bibliografia fetched:", bibliografia);

    console.log("Updating local storage...");
    localStorage.setItem("lastUpdate", lastUpdate);
    localStorage.setItem("bibliografia", JSON.stringify(bibliografia));
  } else {
    console.log(
      "No updates found or local storage is up-to-date. Using local storage data...",
    );
  }

  // Now, you can proceed with your application logic, using the bibliografia data from local storage
});
</script>
