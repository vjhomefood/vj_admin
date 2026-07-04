<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Member Management</h2>
        <p>Manage members across all batches</p>
      </div>
      <button v-if="auth.isAdmin" class="btn btn-primary" @click="openAdd" id="btn-add-member">
        + Add Member
      </button>
    </div>

    <div class="page-body">
      <div v-if="alert.msg" class="alert" :class="'alert-'+alert.type">{{ alert.msg }}</div>

      <!-- Filters -->
      <div class="filter-bar">
        <input v-model="search" placeholder="Search member..." id="member-search" />
        <select v-model="filterBatch" id="member-filter-batch">
          <option value="">All Batches</option>
          <option v-for="b in batchStore.batches" :key="b._id" :value="b.batchId">
            {{ b.batchId }} – {{ b.batchName }}
          </option>
        </select>
        <select v-model="filterStatus" id="member-filter-status">
          <option value="">All Status</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div class="table-wrapper">
        <div class="table-header">
          <div>
            <h3>Members</h3>
            <p>{{ filtered.length }} member{{ filtered.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>
        <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading...</div>
        <table v-else>
          <thead>
            <tr>
              <th>#</th>
              <th>Member ID</th>
              <th>Batch</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Added</th>
              <th v-if="auth.isAdmin">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td :colspan="auth.isAdmin ? 8 : 7">
                <div class="empty-state">
                  <div class="empty-icon" style="font-size:36px;margin-bottom:10px">&#9776;</div>
                  <h4>No members found</h4>
                  <p>Add members using the button above</p>
                </div>
              </td>
            </tr>
            <tr v-for="(m, i) in filtered" :key="m._id">
              <td style="color:#94a3b8;font-size:12px">{{ i + 1 }}</td>
              <td><strong style="font-family:monospace;font-size:13px">{{ m.memberId }}</strong></td>
              <td>
                <span style="background:#eff6ff;color:#2563eb;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600">
                  {{ m.batchId }}
                </span>
              </td>
              <td style="font-weight:600">{{ m.name }}</td>
              <td>{{ m.phone || '—' }}</td>
              <td>
                <span class="badge" :class="m.status==='Active'?'badge-active':'badge-inactive'">{{ m.status }}</span>
              </td>
              <td style="color:#94a3b8;font-size:12px">{{ formatDate(m.createdAt) }}</td>
              <td v-if="auth.isAdmin">
                <div style="display:flex;gap:6px">
                  <button class="btn btn-secondary btn-sm" @click="openEdit(m)" :id="`btn-edit-member-${m.memberId}`"> Edit</button>
                  <button class="btn btn-danger btn-sm" @click="confirmDelete(m)" :id="`btn-del-member-${m.memberId}`"> Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? 'Edit Member' : 'Add New Member' }}</h3>
          <p>{{ editing ? 'Update member details' : 'Fill in the details to add a member' }}</p>
        </div>
        <div v-if="formError" class="alert alert-error">{{ formError }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label>Member ID *</label>
            <input id="form-memberId" v-model="form.memberId" placeholder="e.g. M001" :disabled="!!editing" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="form-member-status" v-model="form.status">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Batch *</label>
            <select id="form-member-batch" v-model="form.batchId">
              <option value="">-- Select Batch --</option>
              <option v-for="b in batchStore.batches" :key="b._id" :value="b.batchId">
                {{ b.batchId }} – {{ b.batchName }}
              </option>
            </select>
          </div>
          <div class="form-group full">
            <label>Full Name *</label>
            <input id="form-memberName" v-model="form.name" placeholder="e.g. Ajay Kumar" />
          </div>
          <div class="form-group full">
            <label>Phone</label>
            <input id="form-memberPhone" v-model="form.phone" placeholder="e.g. 9876543210" maxlength="10" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal" id="btn-cancel-member">Cancel</button>
          <button class="btn btn-primary" @click="saveMember" :disabled="saving" id="btn-save-member">
            {{ saving ? 'Saving...' : (editing ? 'Update' : 'Save Member') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm=false">
      <div class="modal confirm-dialog">
        <div class="danger-icon">!</div>
        <h3>Delete Member?</h3>
        <p>This will permanently delete <strong>{{ deleteTarget?.name }}</strong> ({{ deleteTarget?.memberId }}).</p>
        <div class="modal-footer" style="justify-content:center">
          <button class="btn btn-secondary" @click="showDeleteConfirm=false">Cancel</button>
          <button class="btn btn-danger" @click="doDelete" :disabled="saving" id="btn-confirm-delete-member">
            {{ saving ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useBatchStore } from '../store/batch'
import { useMemberStore } from '../store/member'

const auth = useAuthStore()
const batchStore = useBatchStore()
const memberStore = useMemberStore()
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const filterBatch = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const editing = ref(null)
const deleteTarget = ref(null)
const formError = ref('')
const alert = ref({ msg: '', type: 'success' })

const emptyForm = () => ({ memberId: '', batchId: '', name: '', phone: '', status: 'Active' })
const form = ref(emptyForm())

const filtered = computed(() => {
  return memberStore.members.filter(m => {
    const q = search.value.toLowerCase()
    const matchSearch = !q || m.memberId.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.batchId.toLowerCase().includes(q) || (m.phone||'').includes(q)
    const matchBatch = !filterBatch.value || m.batchId === filterBatch.value
    const matchStatus = !filterStatus.value || m.status === filterStatus.value
    return matchSearch && matchBatch && matchStatus
  })
})

onMounted(async () => {
  loading.value = true
  await Promise.all([batchStore.fetchBatches(), memberStore.fetchMembers()])
  loading.value = false
})

function getNextMemberId() {
  if (!memberStore.members || memberStore.members.length === 0) {
    return 'M001'
  }
  let maxIdNum = 0
  memberStore.members.forEach(m => {
    if (m.memberId) {
      const match = m.memberId.match(/^M(\d+)$/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxIdNum) {
          maxIdNum = num
        }
      }
    }
  })
  const nextNum = maxIdNum + 1
  return 'M' + String(nextNum).padStart(3, '0')
}

function openAdd() {
  editing.value = null;
  form.value = emptyForm();
  form.value.memberId = getNextMemberId();
  formError.value = '';
  showModal.value = true;
}
function openEdit(m) { editing.value = m; form.value = { memberId: m.memberId, batchId: m.batchId, name: m.name, phone: m.phone, status: m.status }; formError.value = ''; showModal.value = true }
function closeModal() { showModal.value = false; formError.value = '' }
function confirmDelete(m) { deleteTarget.value = m; showDeleteConfirm.value = true }

async function saveMember() {
  formError.value = ''
  if (!form.value.memberId.trim() || !form.value.name.trim() || !form.value.batchId) {
    formError.value = 'Member ID, Batch, and Name are required.'; return
  }
  saving.value = true
  try {
    if (editing.value) {
      await memberStore.updateMember(editing.value._id, form.value)
      showAlert('Member updated!', 'success')
    } else {
      await memberStore.createMember(form.value)
      showAlert('Member added!', 'success')
    }
    closeModal()
  } catch (e) {
    formError.value = e.response?.data?.message || 'Failed to save.'
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  saving.value = true
  try {
    await memberStore.deleteMember(deleteTarget.value._id)
    showDeleteConfirm.value = false
    showAlert('Member deleted.', 'success')
  } catch (e) {
    showAlert(e.response?.data?.message || 'Delete failed.', 'error')
  } finally {
    saving.value = false
  }
}

function showAlert(msg, type) {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 3000)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}
</script>
