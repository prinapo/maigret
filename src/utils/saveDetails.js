// in questo file definisco le fiunzioni per salvare i dati che modifico nella pagina dettagli
// essedno una lista di dati di cui uno è iun array ho funzioni deiverse per
// salvare i dettagli non nell'array che **saveDetail** salva nel database del singolo libro
// salvare i dettagli all'interno di una edizione **saveEdizioneDetail** che salva nel database del singolo libro
// salvare i dettagli di possesso del libro **savePossessoDetail** che salva nel database dell'utente
// cancellare un libro dal databae **deleteBoo** questa è critica perchè provoca errori se qualcuno la ha nella
// collezzione, per fare una cosa corretta andrebbe verifciato prima che nessuno ha il record nella collezzione
// se ce ne è uno non si deve cancellare
// deletebook non cancella davvero il libro ma lo sposta nel cestino delle bibliografie

import { db } from "../firebase/firebaseInit";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { updateTimestamp } from "../utils/global";
import {
  useBibliografiaStore,
  useCollaneStore,
  useEditoriStore,
} from "src/store/database";

import { Notify } from "quasar";
import { fireStoreUrl } from "../firebase/firebaseInit";

const bibliografiaStore = useBibliografiaStore();
const collaneStore = useCollaneStore();
const editoriStore = useEditoriStore();

// dichiaro la variabile che fa riferimento al libro in modifica globalmente per usarla in piu funzioni

export const saveDetail = async (bookId, itemId, value) => {
  // creo il nuovo timestamp
  const timestamp = new Date().valueOf();
  const bookRef = doc(db, "Bibliografia", bookId);
  // console.log(bookId);
  // console.log(itemId);
  // console.log(value);
  try {
    //creo il ref al libro corrente le info del signolo libro

    // Uso "setDoc per fare un merge tra i dati che carico e i dati presenti nele documento online
    await setDoc(
      bookRef,
      {
        [itemId]: value,
      },
      { merge: true },
    );
    // aggiorno il timestamp nel libro corrente
    await setDoc(
      bookRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    // chiamo la funxione per aggiornare il timestamp localmente
    // Update timestamp
    await updateTimestamp(timestamp);

    //se collana o editore devo cercare il valore e aggiungerlo

    if (itemId === "collana") {
      const collaneData = collaneStore.collane.collana;
      // per ogni libro cerco il nome collana corrispondente all'id e lo
      // copio nel comapo collanaName che creo localmente e nons su firebase

      const bibliografiaCollanaId = value;
      const matchingCollana = collaneData.find(
        (collana) => collana.id === bibliografiaCollanaId,
      );
      if (matchingCollana) {
        //aggiorno il campo collanaName
        bibliografiaStore.updateBookDetail(
          bookId,
          "collanaName",
          matchingCollana.collana,
        );
      }
    } else if (itemId === "editore") {
      const editoriData = editoriStore.editori.editore;
      // per ogni libro cerco il nome editore corrispondente all'id e lo
      // copio nel comapo editoreName che creo localmente e non su firebase

      // Find the matching collana object in collane array
      const bibliografiaEditoreId = value;
      const matchingEditore = editoriData.find(
        (editore) => editore.id === bibliografiaEditoreId,
      );
      if (matchingEditore) {
        bibliografiaStore.updateBookDetail(
          bookId,
          "editoreName",
          matchingEditore.editore,
        );
      }
    } else {
      bibliografiaStore.updateBookDetail(bookId, itemId, value);
    }

    const bibliografiaData = bibliografiaStore.bibliografia;
    localStorage.setItem("bibliografia", JSON.stringify(bibliografiaData));

    Notify.create({
      message: `Detail ${itemId} Saved`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Detail  ${itemId} Not Saved`,
      type: "negative",
      color: "red",
    });

    console.error("Error saving detail:", error);
  }
};

export const saveImageDetail = async (name, bookId, value, index) => {
  try {
    const timestamp = new Date().valueOf();
    const bookRef = doc(db, "Bibliografia", bookId);
    const dataSnapshot = await getDoc(bookRef);
    const data = dataSnapshot.data();
    const imagesArray = data.images || [];

    if (index >= 0 && index < imagesArray.length) {
      // Update the imageName property of the object at the specified index
      imagesArray[index].id = value; // Use the correct property name 'imageName'
    } else {
      // Handle the case where the index is out of bounds
      console.error("Index is out of bounds:", index);
    }
    // Update the specified item in the 'edizioni' array
    await updateDoc(bookRef, { images: imagesArray });

    // Update the timestamp in the parent document
    await setDoc(
      bookRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    const bibliografiaStore = useBibliografiaStore();
    const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );
    if (bookIndexInBibliografia !== -1) {
      // Book found in bibliografiaStore, you can access it using bibliografiaStore.bibliografia[bookIndexInBibliografia]

      bibliografiaStore.bibliografia[bookIndexInBibliografia].images =
        imagesArray;

      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );
    }

    // Call the function to update the timestamp locally
    await updateTimestamp(timestamp);
    Notify.create({
      message: "Detail Saved",
      type: "positive",
      color: "green",
    });
  } catch (error) {
    console.error("Error saving detail:", error);
    Notify.create({
      message: "Detail Not Saved",
      type: "negative",
      color: "red",
    });
  }
};

export const saveEdizioneDetail = async (name, index, value, bookId) => {
  try {
    const timestamp = new Date().valueOf();

    const bookRef = doc(db, "Bibliografia", bookId);
    const edizioniSnapshot = await getDoc(bookRef);
    const edizioniData = edizioniSnapshot.data();
    const existingEdizioni = edizioniData.edizioni || [];

    // Create a new array with the updated value
    const updatedEdizioni = existingEdizioni.map((item, i) => {
      if (i === index) {
        // If it's the target index, update the specified field
        return {
          ...item,
          [name]: value,
        };
      } else {
        // Otherwise, return the item as is
        return item;
      }
    });

    // Update the specified item in the 'edizioni' array
    await updateDoc(bookRef, { edizioni: updatedEdizioni });

    // Update the timestamp in the parent document
    await setDoc(
      bookRef,
      {
        timestamp: timestamp,
      },
      { merge: true },
    );

    // Call the function to update the timestamp locally
    await updateTimestamp(timestamp);
    Notify.create({
      message: `Edizionie Saved  ${updatedEdizioni}`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Edizioni Not Saved ${updatedEdizioni}`,
      type: "negative",
      color: "red",
    });
    console.error("Error saving edizione detail:", error);
  }
};

export const savePossessoEdizione = async (edizione, value, userID, bookId) => {
  try {
    // Access the actual value of userID

    const userDocRef = doc(db, "Users", userID);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      // Get the user data
      const userData = userDocSnap.data();

      if (Array.isArray(userData.edizioni)) {
        // Check if the edizione already exists in the array
        const existingEdizioneIndex = userData.edizioni.findIndex(
          (item) => item.edizioneUuid === edizione,
        );
        if (existingEdizioneIndex !== -1) {
          // If the edizione exist, update posseduto
          userData.edizioni[existingEdizioneIndex].posseduto = value;

          // Update the user document in Firestore to only update the edizioni array
        } else {
          // If the edizione already exists, update the posseduto value if it's different from the new value
          userData.edizioni.push({ edizioneUuid: edizione, posseduto: value });
        }

        await updateDoc(userDocRef, {
          edizioni: userData.edizioni,
        });
      } else {
        // If userData.edizioni is not an array or is null, create a new array with the entry

        userData.edizioni = [{ edizioneUuid: edizione, posseduto: value }];
        await updateDoc(userDocRef, {
          edizioni: userData.edizioni,
        });
      }

      // Check if any edition in editions has posseduto = true
      const oneEditionPossessed = userData.edizioni.some(
        (edition) => edition.posseduto,
      );
      //end of signle edition updated on friebase
      //start the whole book updated on firebase only no need to ahve it locally
      // se una edizion è posseduta devo mettere a true il valore possdeuto del libro
      if (!userData.books) {
        //the user data does not includes a books array
        userData.books = [];
      }
      // Check if the book already exists in the array
      const existingBookIndex = userData.books.findIndex(
        (item) => item.edizioneUuid === bookId,
      );

      if (existingBookIndex !== -1) {
        // If the book exist, update posseduto
        userData.books[existingBookIndex].posseduto = oneEditionPossessed;
        // Update the user document in Firestore to only update the edizioni array
      } else {
        // If the book do not  exists, update the posseduto value if it's different from the new value
        userData.books.push({
          edizioneUuid: bookId,
          posseduto: value,
        });
      }
      //salvo il valore in firestore
      await updateDoc(userDocRef, {
        books: userData.books,
      });
      //update biblografia in local storage
      const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
        (book) => book.id === bookId,
      );

      if (bookIndexInBibliografia !== -1) {
        // Book found in bibliografiaStore, you can access it using bibliografiaStore.bibliografia[bookIndexInBibliografia]
        const bookToUpdate =
          bibliografiaStore.bibliografia[bookIndexInBibliografia];

        bookToUpdate.possessed = oneEditionPossessed;
        localStorage.setItem(
          "bibliografia",
          JSON.stringify(bibliografiaStore.bibliografia),
        );
      } else {
        // Book not found in bibliografiaStore
        console.log("Book not found in bibliografiaStore");
      }
    }
    Notify.create({
      message: `Posseduto Saved`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Posseduto Not Saved`,
      type: "negative",
      color: "red",
    });
    console.error("Error saving possession edition:", error);
  }
};
//quando salco i dati di possesso dell'edizione devo anche aggiornare i dati
//nella bibliografia locale se no si disallienano
//
//
export const deleteBook = async (bookId) => {
  const bibliografiaRef = doc(db, "Bibliografia", bookId);

  try {
    const bibliografiaData = (await getDoc(bibliografiaRef)).data();

    // Move the book to BibliografiaTrash
    await setDoc(doc(db, "BibliografiaTrash", id), bibliografiaData);

    // Delete the book from Bibliografia collection
    await deleteDoc(bibliografiaRef);

    // Remove the book from local storage if exists
    const localBibliografiaData = localStorage.getItem("bibliografiaData");
    if (localBibliografiaData) {
      const updatedBibliografiaData = JSON.parse(localBibliografiaData).filter(
        (item) => item.id !== id,
      );
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(updatedBibliografiaData),
      );
    }

    // Remove the book from Pinia store if exists
    const bibliografiaStore = useBibliografiaStore();
    bibliografiaStore.removeBook(id); // Assuming a method like removeBook exists in your Pinia store

    // Close the confirmation dialog
    confirm.value = false;
    Notify.create({
      message: `Book Deleted`,
      type: "positive",
      color: "green",
    });
  } catch (error) {
    Notify.create({
      message: `Book not deleted`,
      type: "negative",
      color: "red",
    });
    console.error("Error moving book to BibliografiaTrash:", error);
  }
};

export const handleFileUploaded = async (
  bookId,
  OriginalFileName,
  filename,
  index,
) => {
  const fileExtension = OriginalFileName.split(".").pop();
  const targetFileName = `${filename.split(".")[0]}.${fileExtension}`;

  try {
    // read and update the book on firebase
    // ho caricato l'immagine e adesso scrivo sul database
    // sul libro il nome dell'immagine

    const bookRef = doc(db, "Bibliografia", bookId);
    const dataSnapshot = await getDoc(bookRef);
    const BookData = dataSnapshot.data();
    BookData.images[index].name = targetFileName;

    await updateDoc(bookRef, {
      images: BookData.images,
    });

    //aggiorno anche il file di bibliografia locale
    //e poi aggiorno il loval storage
    const bibliografiaStore = useBibliografiaStore();
    const bookIndexInBibliografia = bibliografiaStore.bibliografia.findIndex(
      (book) => book.id === bookId,
    );

    if (bookIndexInBibliografia !== -1) {
      bibliografiaStore.bibliografia[bookIndexInBibliografia].images[
        index
      ].name = targetFileName;
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );

      const book = bibliografiaStore.bibliografia[bookIndexInBibliografia];
      // guardo se essite una prima copertina e lo metto nel campi imageurl per poterla vedere
      // Check if the book has an 'images' array and if it contains an entry with id=qNvdwFMLNt2Uz7JjqTjacu
      // questo id rappresenta l'uuid di prima copertina
      if (book.images && Array.isArray(book.images)) {
        const imageEntry = book.images.find(
          (image) => image.id === "qNvdwFMLNt2Uz7JjqTjacu",
        );
        if (imageEntry) {
          book.imageUrl = `${fireStoreUrl}${imageEntry.name}?alt=media`;
          //console.log("book.imageUrl prima copertina", book.imageUrl);
        } else if (book.images.length > 0) {
          // If the entry exists, copy the value of the 'name' field to bibliografiaData.imageUrl
          book.imageUrl = `${fireStoreUrl}${book.images[0].name}?alt=media`;

          //          console.log("book.imageUrl no prima copertina", book.imageUrl);
        } else {
          // If the entry does not exist, remove bibliografiaData.imageUrl if it exists
          book.imageUrl = null;
        }
      } else {
        // Handle the case where 'images' array is missing or not an array
        book.imageUrl = null;
      }
      bibliografiaStore.bibliografia[bookIndexInBibliografia].imageUrl =
        book.imageUrl;
      localStorage.setItem(
        "bibliografia",
        JSON.stringify(bibliografiaStore.bibliografia),
      );
      //    console.log(
      //      "bibligrafiatoriaStore.bibliografia[bookIndexInBibliografia].imageUrl",
      //      bibliografiaStore.bibliografia[bookIndexInBibliografia].imageUrl,
      //    );
    }

    Notify.create({
      message: `Image Saved`,
      type: "positive",
      color: "green",
    });

    return BookData.images;
  } catch (error) {
    Notify.create({
      message: `Image Not Saved`,
      type: "negative",
      color: "red",
    });
    console.error("Error fetching document:", error);
    // Handle the error here
  }
  // update PINIA store and local storage fin the index of the book

  // once the fields are updated I need to update also imageurl in bibliografia
};
