<template>
  <BaseNode
    :id="id"
    type="condition"
    :data="data"
    :selected="selected"
    :status="status"
    :show-actions="showActions"
    :show-status="showStatus"
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
  showActions: Boolean,
  showStatus: Boolean
})

defineEmits(['configure', 'duplicate', 'delete'])
</script>
