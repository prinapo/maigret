import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  useBibliografiaStore,
  useCollaneStore,
  useEditoriStore,
} from "../store/database";
import { ref } from "vue";
import { useAuth } from "../composable/auth";
import { fireStoreUrl } from "../firebase/firebaseInit";
const { userId, checkAuthState } = useAuth();
// Call checkAuthState to ensure isLoggedIn is up-to-date
checkAuthState();

// Function to fetch and update Bibliografia data and localStorage
export async function fetchAndUpdateBibliografia() {
  const loading = ref(true); // Initialize as true to show the spinner

  try {
    const bibliografiaStore = useBibliografiaStore(); // Initialize the Pinia store
    const collaneStore = useCollaneStore(); // Initialize the Pinia store
    const editoriStore = useEditoriStore(); // Initialize the Pinia store

    const editoriData = editoriStore.editori.editore;
    const collaneData = collaneStore.collane.collana;

    // Read the last update time for Bibliografia from the "Updates" collection
    const bibliografiaTimeRef = doc(db, "Updates", "bibliografiaTimes");
    const bibliografiaTimeSnapshot = await getDoc(bibliografiaTimeRef);
    const bibliografiaTimeData = bibliografiaTimeSnapshot.data();
    const bibliografiaLastUpdateFirebase = bibliografiaTimeData.biblioTimestamp;

    const localBibliografiaLastUpdate =
      parseInt(localStorage.getItem("bibliografiaLastUpdate")) || 0;

    // controllo che un valore locale esista, se non esiste
    // o se è minore di quello su firebase carico la bilbiografia da Firebase
    if (
      !localBibliografiaLastUpdate ||
      bibliografiaLastUpdateFirebase > localBibliografiaLastUpdate
    ) {
      console.log(
        "First boot or updates are newer than local storage for Bibliografia. Fetching Bibliografia...",
      );
      const bibliografiaRef = collection(db, "Bibliografia");
      const bibliografiaSnapshot = await getDocs(bibliografiaRef);
      console.log("ricevuto bilbio");

      // Mappo i campi che sono nei libri in bibliografia in un array di oggetti
      // In reltà ci sono dei campi come uniqueId che non dovrebbero servire, il campo
      // id (doc.id) è già l'identificativo univoco
      const bibliografiaData = bibliografiaSnapshot.docs.map((doc) => ({
        id: doc.id,
        titolo: doc.data().titolo,
        editore: doc.data().editore,
        collana: doc.data().collana,
        numeroCollana: doc.data().numeroCollana,
        signedUrl: doc.data().signedUrl,
        uniqueId: doc.data()._id,
        imageUrl: doc.data().imageUrl,
        images: doc.data().images || [],
      }));

      console.log("ricevuto bilbioData", userId.value);

      // Per poter gestire il pssesso dei libri devo caricare i dati
      // dell'utete registrato in Firebase
      const userIdValue = userId.value;
      console.log("set userDI", userIdValue);
      if (userIdValue) {
        const userDocRef = doc(db, "Users", userIdValue);
        console.log("set userDocRef");

        const userDocSnap = await getDoc(userDocRef);
        console.log("set userDocSnap");
        const userData = userDocSnap.data();

        // in userData sono salvati tutti i libri posseduti dall'utente
        // Iterate through both bibliografiaData and userData.books arrays
        // lo scopo è di aggiungere ad ogni libro lo stato del possesso
        //di almeno una edizione
        console.log("entering the first foreach");
        bibliografiaData.forEach((entry) => {
          if (Array.isArray(userData.books) && userData.books.length > 0) {
            console.log("entering the second foreach");

            userData.books.forEach((book) => {
              // Check if the uniqueId exists in the user's books array
              if (book.edizioneUuid === entry.id) {
                // Copy the value of the possessed variable to entry.possessed
                entry.possessed = book.posseduto;
              }
            });
          } else {
            // userData.books is empty or not an array
            // Handle this case as per your requirements
            // For example, you can set entry.possessed to false
            entry.possessed = false;
          }
        });
      }
      // bibliogrfiaData adesso ha un campo possessed per ogni libro
      // ora visto che le collane sono inserite nel database di firebase come
      // un uuid che corrisponde a una collana nel database Collane su Firebase
      // devo aggiungere il nome della collana al libro
      // Copio in collaneData il valore collana nell'array che contiene collana e uuid
      //      console.log("Collane store.collane", collaneStore.collane.collana);

      // per ogni libro cerco il nome collana corrispondente all'id e lo
      // copio nel comapo collanaName che creo localmente e nons su firebase
      if (collaneData) {
        // Iterate over each entry in bibliografiaData
        console.log("entering the third foreach");

        bibliografiaData.forEach((entry) => {
          // Check if the entry has a valid collana ID
          if (entry.collana) {
            // Find the matching collana object in collaneData array
            const matchingCollana = collaneData.find(
              (collana) => collana.id === entry.collana,
            );

            if (matchingCollana) {
              // Assign the collana name to collanaName property of the entry
              entry.collanaName = matchingCollana.collana;
            }
          }
        });
      } else {
        console.error("Collane data is missing.");
      }
      // faccio per gli editori la stessa cos che ho fatto per le collane

      // per ogni libro cerco il nome editore corrispondente all'id e lo
      // copio nel comapo editoreName che creo localmente e non su firebase
      console.log("entering the fourth foreach");

      bibliografiaData.forEach((entry) => {
        // Find the matching collana object in collane array
        const bibliografiaEditoreId = entry.editore;
        const matchingEditore = editoriData.find(
          (editore) => editore.id === bibliografiaEditoreId,
        );
        if (matchingEditore) {
          entry.editoreName = matchingEditore.editore;
        }
      });
      // devi aggiungere l'immagine dell'immagine di copertina
      // prendo l'immagine che ha come "id prima di copertine"
      // e se non c'è quella con indice 0
      console.log("entering the fisth foreach");

      bibliografiaData.forEach((book) => {
        // Check if the book has an 'images' array and if it contains an entry with id=qNvdwFMLNt2Uz7JjqTjacu
        if (book.images && Array.isArray(book.images)) {
          console.log("entering the find");

          const imageEntry = book.images.find(
            (image) => image.id === "qNvdwFMLNt2Uz7JjqTjacu",
          );
          if (imageEntry) {
            book.imageUrl = `${fireStoreUrl}${imageEntry.name}?alt=media`;
          } else if (book.images.length > 0 && book.images[0].name) {
            // If the entry exists, copy the value of the 'name' field to bibliografiaData.imageUrl
            book.imageUrl = `${fireStoreUrl}${book.images[0].name}?alt=media`;
          } else {
            // If the entry does not exist, remove bibliografiaData.imageUrl if it exists
            book.imageUrl = "src/assets/400x600.png";
          }
        } else {
          // Handle the case where 'images' array is missing or not an array
          book.imageUrl = "src/assets/400x600.png";
        }
      });
      console.log("bibliografiaData", bibliografiaData);
      //
      // a questo punto aggiorno il campo bibliografia su PINIA
      bibliografiaStore.updateBibliografia(bibliografiaData); // Update Pinia store

      // aggiorno il campo bibliografia anche sul local storage
      localStorage.setItem("bibliografia", JSON.stringify(bibliografiaData));
      // aggiorno il campo ultimo aggiornamento su localStorage
      //  allineandolo  aquello su firebase
      localStorage.setItem(
        "bibliografiaLastUpdate",
        bibliografiaLastUpdateFirebase,
      );
    } else {
      // non ci sono aggiornamenti il file su firebase è aggiornato
      // con quello locale
      // Copio i dati dal local storage e aggiorno PINIA
      console.log("entering the getstorage");

      const localBibliografiaData = localStorage.getItem("bibliografia");

      if (localBibliografiaData) {
        // Update Pinia store with the locally stored data
        bibliografiaStore.updateBibliografia(
          JSON.parse(localBibliografiaData),
        ) || [];
      }
    }
  } catch (error) {
    console.error("Error fetching and updating Bibliografia:", error);
  } finally {
    loading.value = false; // Set loading to false after fetch operation completes
  }
  return { loading };
}
