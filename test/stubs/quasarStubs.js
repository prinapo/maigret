export default {
  "q-virtual-scroll": {
    props: {
      items: Array,
      virtualScrollHorizontal: Boolean,
      virtualScrollItemSize: Number,
      virtualScrollSliceSize: Number,
      isFieldEditable: {
        type: Boolean,
        default: true,
      },
    },
    template: `
        <div class="virtual-scroll-container">
          <template v-for="(item, index) in items" :key="index">
            <slot :item="item" :index="index"></slot>

          </template>
        </div>
      `,
  },
  "q-img": true,
  "q-icon": true,
  "q-select": {
    template: `
        <div class="q-select">
          <select
            :value="modelValue"
            @change="onChange"
            :disabled="disable"
          >
            <option
              v-for="option in options"
              :key="option.value"
              :value="option.value"
            >
            {{ option.label }}
            </option>
          </select>
        </div>`,
    props: ["modelValue", "options", "label", "disable", "prefix"],
    methods: {
      onChange(event) {
        this.$emit("update:model-value", event.target.value);
      },
    },
  },
  "q-dialog": true,
  "q-card": true,
  "q-card-section": true,
  "q-card-actions": true,
  "q-btn": true,
  "q-uploader": {
    template: `
        <div class="q-uploader">
          <input
            type="file"
            @change="$emit('added', $event.target.files)"
            class="full-width q-mt-sm"
          />
        </div>
      `,
    props: ["url", "hideUploadBtn", "multiple"],
  },
};
