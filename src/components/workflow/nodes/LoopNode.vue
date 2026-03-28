<template>
  <BaseNode
    :id="id"
    type="loop"
    :data="data"
    :selected="selected"
    :status="status"
    :progress="progress"
    :show-actions="showActions"
    :show-status="showStatus"
    :show-progress="showProgress"
    @configure="$emit('configure', $event)"
    @duplicate="$emit('duplicate', $event)"
    @delete="$emit('delete', $event)"
  />
</template>

<script setup>
import BaseNode from './BaseNode.vue'

defineProps({
  id: String,
  data: Object,
  selected: Boolean,
  status: String,
  progress: Number,
  showActions: Boolean,
  showStatus: Boolean,
  showProgress: Boolean
})

defineEmits(['configure', 'duplicate', 'delete'])
</script>
