import { db } from "../firebase/firebaseInit";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import {
  useBibliografiaStore,
  useCollaneStore,
  useEditoriStore,
} from "../store/database";
import { ref } from "vue";
import { useAuth } from "../composable/auth";
const { userId, isLoggedIn, checkAuthState } = useAuth();
// Call checkAuthState to ensure isLoggedIn is up-to-date
checkAuthState();

// Function to fetch and update Bibliografia data and localStorage
export async function fetchAndUpdateBibliografia() {
  const loading = ref(true); // Initialize as true to show the spinner

  try {
    console.log(
      "Fetching last update time for Bibliografia from Updates collection...",
    );

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

    console.log(
      "Bibliografia Firebae Last Update:",
      bibliografiaLastUpdateFirebase,
    );

    const localBibliografiaLastUpdate =
      parseInt(localStorage.getItem("bibliografiaLastUpdate")) || 0;
    console.log(
      "Bibliografia Local Storage Last Update:",
      localBibliografiaLastUpdate,
    );
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
      // Mappo i campi che sono nei libri in bibliografia in un array di oggetti
      // In reltà ci sono dei campi come uniqueId che non dovrebbero servire, il campo
      // id (doc.id) è già l'identificativo univoco
      const bibliografiaData = bibliografiaSnapshot.docs.map((doc) => ({
        id: doc.id,
        titolo: doc.data().titolo,
        editore: doc.data().editore,
        collana: doc.data().collana,
        signedUrl: doc.data().signedUrl,
        uniqueId: doc.data()._id,
        imageUrl: doc.data().imageUrl,
        images: doc.data().images || [],
      }));
      // Per poter gestire il pssesso dei libri devo caricare i dati
      // dell'utete registrato in Firebase
      const userIdValue = userId.value;
      const userDocRef = doc(db, "Users", userIdValue);
      const userDocSnap = await getDoc(userDocRef);
      const userData = userDocSnap.data();
      // in userData sono salvati tutti i libri posseduti dall'utente
      // Iterate through both bibliografiaData and userData.books arrays
      // lo scopo è di aggiungere ad ogni libro lo stato del possesso
      //di almeno una edizione
      bibliografiaData.forEach((entry) => {
        if (Array.isArray(userData.books) && userData.books.length > 0) {
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
      bibliografiaData.forEach((entry) => {
        // Find the matching collana object in collane array
        const bibliografiaImages = entry.images;
        if (bibliografiaImages && Array.isArray(bibliografiaImages)) {
          const imageEntry = bibliografiaImages.find(
            (image) => image.id === "qNvdwFMLNt2Uz7JjqTjacu",
          );

          if (imageEntry) {
            entry.imageUrl = imageEntry.name;
          } else {
            entry.imageUrl = "";
          }
        }
      });

      console.log(
        "Bibliografia data prima di cercare l'immagine:",
        bibliografiaData,
      );
      bibliografiaData.forEach((book) => {
        // Check if the book has an 'images' array and if it contains an entry with id=qNvdwFMLNt2Uz7JjqTjacu
        if (book.images && Array.isArray(book.images)) {
          const imageEntry = book.images.find(
            (image) => image.id === "qNvdwFMLNt2Uz7JjqTjacu",
          );
          if (imageEntry) {
            console.log("Image entry cover found:", imageEntry);
            book.imageUrl = imageEntry.name;
          } else if (book.images.length > 0) {
            console.log("Image entry 0 found:", book.images[0]);
            // If the entry exists, copy the value of the 'name' field to bibliografiaData.imageUrl
            book.imageUrl = book.images[0].name;
          } else {
            // If the entry does not exist, remove bibliografiaData.imageUrl if it exists
            book.imageUrl = null;
          }
        } else {
          // Handle the case where 'images' array is missing or not an array
          book.imageUrl = null;
        }
      });

      //
      console.log("Bibliografia fetched:", bibliografiaData);
      // a questo punto aggiorno il campo bibliografia su PINIA
      bibliografiaStore.updateBibliografia(bibliografiaData); // Update Pinia store

      //console.log("Updating local storage for Bibliografia...");

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
      console.log("Bibliografia No updates found");
      // Copio i dati dal local storage e aggiorno PINIA
      const localBibliografiaData = localStorage.getItem("bibliografia");

      if (localBibliografiaData) {
        // Update Pinia store with the locally stored data
        bibliografiaStore.updateBibliografia(JSON.parse(localBibliografiaData));
      }
    }
  } catch (error) {
    console.error("Error fetching and updating Bibliografia:", error);
  } finally {
    loading.value = false; // Set loading to false after fetch operation completes
  }
  return { loading };
}
