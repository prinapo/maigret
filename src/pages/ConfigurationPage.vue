<template>
  <div class="container">
    <div class="text-center mt-6">
      <q-btn
        label="Check Image Consistency"
        color="primary"
        @click="checkImageConsistency"
      />
    </div>

    <q-dialog v-model="showImageConsistencyResults" persistent>
      <q-card>
        <q-card-section>
          <div v-if="unreferencedImages.length">
            <h6>Unreferenced Images:</h6>
            <div class="row">
              <div
                v-for="image in unreferencedImages"
                :key="image"
                class="col-3 text-center"
              >
                <img
                  :src="getImageSource(image)"
                  alt="Unreferenced Image"
                  class="img-thumbnail"
                />
                <p>{{ image }}</p>
                <p>{{ getImageSource(image) }}</p>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
          <q-btn
            flat
            label="Download All"
            color="primary"
            @click="downloadAllUnreferencedImages"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { db } from "../firebase/firebaseInit";
import { collection, getDocs } from "firebase/firestore";
import {
  listAll,
  ref as storageRef,
  getStorage,
  getDownloadURL,
} from "firebase/storage";
import placeholderImage from "../assets/placeholder.jpg";
import { fireStoreUrl } from "../firebase/firebaseInit";

const showImageConsistencyResults = ref(false);
const unreferencedImages = ref([]);

const getImageSource = (imageName) => {
  try {
    if (!imageName || imageName === "placeholder.jpg") {
      return placeholderImage;
    }
    return `${fireStoreUrl}${encodeURIComponent(imageName)}?alt=media`;
  } catch (error) {
    return placeholderImage;
  }
};

const checkImageConsistency = async () => {
  const storage = getStorage();
  const imagesRef = storageRef(storage, "images");
  const thumbnailsRef = storageRef(storage, "thumbnails");

  const [imagesList, thumbnailsList] = await Promise.all([
    listAll(imagesRef),
    listAll(thumbnailsRef),
  ]);

  const images = new Set(imagesList.items.map((item) => item.name));
  const thumbnails = new Set(thumbnailsList.items.map((item) => item.name));

  const booksRef = collection(db, "Bibliografia");
  const booksSnap = await getDocs(booksRef);

  unreferencedImages.value = [];

  booksSnap.forEach((doc) => {
    const book = doc.data();
    const imageName = book.defaultImageName;

    if (imageName) {
      images.delete(imageName);
      thumbnails.delete(imageName);
    }

    if (book.images) {
      book.images.forEach((img) => {
        const imgName = img.name;
        images.delete(imgName);
        thumbnails.delete(imgName);
      });
    }
  });

  unreferencedImages.value = [...images];

  showImageConsistencyResults.value = true;
};

const downloadAllUnreferencedImages = async () => {
  const storage = getStorage();

  for (const imageName of unreferencedImages.value) {
    const imageRef = storageRef(storage, `images/${imageName}`);
    const imageUrl = await getDownloadURL(imageRef);
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
</script>

<style scoped>
.img-thumbnail {
  max-width: 100%;
  height: auto;
}
</style>
