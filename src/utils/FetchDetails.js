import { ref } from "vue";
import { db } from "../firebase/firebaseInit";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

import { updateTimestamp } from "../utils/global";
import { useEditoriStore, useCollaneStore } from "src/store/database";

const bookDetails = ref([]);
const edizioni = ref([]);
const images = ref([]);

// dichiaro le variabili che fanno riferimento ai dati di editori
// e di collane come sono savlti in PINIA
const editori = ref([]);
const collane = ref([]);
const editoriStore = useEditoriStore();
const collaneStore = useCollaneStore();
editori.value = editoriStore.editori.editore;
collane.value = collaneStore.collane.collana;

// dichiaro la variabile che fa riferimento al libro in modifica globalmente per usarla in piu funzioni
let fetchedBook = [];

//questa funzione mi genera un UUID piu corto di quellostandard, tanto no ndevo ospritare troppi elementi
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
// Fetch book details based on ID
export const fetchBookDetails = async (userIdValue, loggedIn, bookId) => {
  //console.log(
  //  "fetchBookDetails",
  //   userIdValue,
  //   " loggedIn",
  //   loggedIn,
  //   "bookID",
  //   bookId,
  // );
  // console.log("user", userIdValue);
  const bookRef = doc(db, "Bibliografia", bookId);
  const bookDocSnap = await getDoc(bookRef);
  const bookData = bookDocSnap.data();

  // controllo che tipi di utente è per capire i suoi diritti
  // non sono sicuro che centri con questo

  try {
    if (bookDocSnap.exists()) {
      fetchedBook = {
        id: bookDocSnap.id,
        ...bookDocSnap.data(),
      };

      //leggo il valore dell' ID della collana e lo confronto con l'arrya "collane" per
      //estrarre il corrispondente nome della collana e lo salvo in selectedCollana

      const selectedOption = collane.value.find(
        (option) => option.id === fetchedBook.collana,
      );
      //console.log("selectedOption", selectedOption);
      const selectedCollana = selectedOption ? selectedOption.collana : null;
      //console.log("selectedCollana", selectedCollana);

      //leggo il valore dell' ID dell'editoe e lo confronto con l'arrya "editori" per
      //estrarre il corrispondente nome della collana e lo salvo in selectedEditore
      const selectedOptionEditori = editori.value.find(
        (option) => option.id === fetchedBook.editore,
      );

      const selectedEditore = selectedOptionEditori
        ? selectedOptionEditori.editore
        : null;
      // creo il campo bookDetails da usare per mostrare i dati nella
      // interfaccia grafica per i campi che hanno poi la possiiblita di
      // scegliere da una lista aggiungo il campo uuid che è
      // l'identificativo unico dell'editore o della collana
      // console.log("fetchedbook", fetchedBook);
      bookDetails.value = [
        {
          id: "editore",
          label: "Editore",
          value: selectedEditore,
          uuid: fetchedBook.editore,
        },
        { id: "titolo", label: "Titolo", value: fetchedBook.titolo },
        {
          id: "collana",
          label: "Collana",
          value: selectedCollana,
          uuid: fetchedBook.collana,
        },
        {
          id: "numeroCollana",
          label: "Numero Collana",
          value: fetchedBook.numeroCollana,
        },
        { id: "lingua", label: "Lingua", value: fetchedBook.lingua },
        {
          id: "annoPubblicazione",
          label: "Pubblicato",
          value: fetchedBook.annoPubblicazione,
        },
        {
          id: "titoloOriginale",
          label: "Titolo Originale",
          value: fetchedBook.titoloOriginale,
        },
      ];

      // se il valore di collana non è vuoto
      // aggiungo il campo collanaName

      // Iterate over each entry in bibliografiaData
      // Check if the entry has a valid collana ID
      // if (fetchedBook.collana) {
      //   // Find the matching collana object in collaneData array
      //   console.log("fetcehdbook collane", fetchedBook.collana);
      //   const matchingCollana = collane.value.find(
      //     (collana) => collana.id === fetchedBook.collana,
      //   );
      //   console.log("matchingCollana", matchingCollana);
      //   if (matchingCollana) {
      //     // Assign the collana name to collanaName property of the entry
      //     bookDetails.value.push({
      //       id: "collanaNome",
      //       label: "Nome Collana",
      //       value: matchingCollana.collana,
      //     });
      //   }
      // } else {
      //   console.error("Collane data is missing.");
      // }
      // console.log("bookDetails after adding collane", bookDetails.value);
      // Ora che ho i dettagli del libro controllo se il libro è presente nel
      //databse dell'utente

      if (userIdValue != null) {
        const userDocRef = doc(db, "Users", userIdValue);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        edizioni.value = bookData.edizioni;

        //controllo che esista almeno un campo edizione altrimenti lo devo creare
        if (!edizioni.value || edizioni.value.length === 0) {
          //          await addEdizione(bookId);
          const defaultEdizione = {
            anno: 1900,
            backCoverUrl: "dummy",
            borderCoverUrl: "dummy",
            frontCoverUrl: "dummy",
            numero: 1,
            posseduto: false,
            uuid: generateUUID(),
          };

          let existingEdizioni = bookDocSnap.data().edizioni || [];

          await updateDoc(bookRef, {
            edizioni: [...existingEdizioni, defaultEdizione],
          });

          // Update the local edizioni value
          edizioni.value = [...existingEdizioni, defaultEdizione];
          //aggiiorno il timestamp locale e su firebase
          const timestamp = new Date().valueOf();
          await updateTimestamp(timestamp);
        }

        let userBookIndex = -1;
        //cerco l'indice dell'array books dove c'è corrispondenza tra il bookID e il
        // valore nel database utente
        if (userData && userData.books) {
          userBookIndex = userData.books.findIndex(
            (item) => item.bookUuid === bookId,
          );
        }

        // Check if the book exists in userData.books
        // è nell'elenco se l'indice è diverso da -1
        if (userBookIndex !== -1) {
          bookDetails.value.push({
            id: "posseduto",
            label: "Posseduto",
            value: true,
          });

          //console.log("edizioni.value", edizioni.value);
          // Il campo edizioni esiste
          // Iterate through edizioni.value array
          const updatedEdizioni = edizioni.value.map((edizione) => {
            // Check if userData is defined and if the edizione.uuid exists in userData.edizioni
            if (userData && userData.edizioni) {
              const userDataEdizione = userData.edizioni.find(
                (item) => item.edizioneUuid === edizione.uuid,
              );
              if (userDataEdizione) {
                // If the edizione.uuid exists in userData.edizioni, update the posseduto value
                return { ...edizione, posseduto: userDataEdizione.posseduto };
              }
            }
            // If userData or the edizione.uuid doesn't exist in userData.edizioni, return the original edizione
            return edizione;
          });
          // non sono cosi sicuro che questo sui sopra gestisca il possesso di piu di una edizione
          // va verificato

          edizioni.value = updatedEdizioni;
        }
      }
      images.value = fetchedBook.images;
      return {
        bookDetails: bookDetails.value,
        edizioni: edizioni.value,
        images: images.value,
      };
    } else {
      router.push({ name: "ErrorPage" }); // Redirect to the error route if document does not exist
      console.log("No such document!");
      return { bookDetails: [], edizioni: [], images: [] };
    }
  } catch (error) {
    console.error("Error fetching book details:", error);
  }
};

// Function to generate UUID
