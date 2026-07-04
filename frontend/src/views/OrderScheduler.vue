<template>
  <div>
    <div class="page-header">
      <div>
        <h2>Order Scheduler</h2>
        <p>Daily order management for all batches</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button v-if="auth.isAdmin" class="btn" :class="isHoliday ? 'btn-danger' : 'btn-warning'" @click="toggleHoliday" :disabled="loading || togglingHoliday" id="btn-holiday" style="display:inline-flex;align-items:center;gap:4px">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {{ togglingHoliday ? 'Please wait...' : (isHoliday ? 'Remove Holiday' : 'Mark Holiday') }}
        </button>
        <button class="btn btn-secondary" @click="loadData" :disabled="loading" id="btn-refresh-scheduler">
          Refresh
        </button>
        <button v-if="auth.isAdmin && !isHoliday" class="btn btn-primary" @click="initOrders" :disabled="loading || initializing" id="btn-init-orders">
          {{ initializing ? 'Initializing…' : 'Initialize Orders' }}
        </button>
      </div>
    </div>

    <div class="page-body">
      <div v-if="alert.msg" class="alert" :class="'alert-'+alert.type" style="margin-bottom:12px">
        {{ alert.msg }}
      </div>

      <!-- Holiday Warning Banner -->
      <div v-if="isHoliday" class="holiday-banner" style="background:#fee2e2; border:1.5px solid #fecaca; color:#dc2626; padding:12px 16px; border-radius:8px; margin-bottom:16px; display:flex; align-items:center; gap:8px; font-weight:600; font-size:14px;">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="flex-shrink:0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>This date ({{ displayDate }}) is marked as a holiday. Daily orders are cancelled.</span>
      </div>

      <!-- Date Header -->
      <div class="scheduler-header">
        <div class="date-display">
          <div class="big-date">{{ displayDate }}</div>
          <div class="day-name">{{ dayName }}</div>
        </div>
        <div class="date-input-group">
          <label style="font-size:13px;font-weight:600;color:#64748b">Date:</label>
          <input type="date" :value="selectedDate" @change="onDateChange" id="scheduler-date" />
          <button class="btn btn-primary btn-sm" @click="goToday" id="btn-today">Today</button>
        </div>
      </div>

      <div class="menu-table-wrapper">
        <div class="table-title" style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:700;font-size:13px;color:#0f172a">Daily Menu</span>
            <span style="font-size:12px;color:#64748b;font-weight:400;margin-top:2px">Edit menu name and price for this day</span>
          </div>
          <button v-if="auth.isAdmin" class="btn btn-sm btn-primary" @click="saveAll" :disabled="saving || loading || isHoliday" id="btn-save-menu">
            {{ saving ? 'Saving...' : 'Save Menu' }}
          </button>
        </div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;letter-spacing:.06em;width:130px">Meal</th>
              <th style="padding:10px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;letter-spacing:.06em">Menu Name</th>
              <th style="padding:10px 16px;text-align:right;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;letter-spacing:.06em;width:130px">Price (Rs.)</th>
              <th style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;letter-spacing:.06em;width:160px">Non-Veg</th>
              <th v-if="auth.isAdmin && orders.length > 0" style="padding:10px 16px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;background:#f8fafc;border-bottom:1px solid #e2e8f0;letter-spacing:.06em;width:180px">Cancellation</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="meal in ['breakfast','lunch','dinner']" :key="meal">
              <!-- VEG row -->
              <tr style="border-bottom:1px solid #f1f5f9">
                <td style="padding:10px 16px;font-weight:700;font-size:13px;color:#0f172a;text-transform:uppercase">
                  <span class="type-badge-inline v-badge" style="margin-right:6px">Veg</span>{{ meal }}
                </td>
                <td style="padding:8px 16px">
                  <input
                    v-if="auth.isAdmin"
                    v-model="menu[meal].name"
                    :placeholder="`Enter ${meal} menu name`"
                    class="menu-input"
                    :id="`menu-${meal}-name`"
                    @focus="e => e.target.style.borderColor='#16a34a'"
                    @blur="e => e.target.style.borderColor='#e2e8f0'"
                    @input="onMenuChange"
                  />
                  <span v-else style="font-size:13.5px">{{ menu[meal].name || '—' }}</span>
                </td>
                <td style="padding:8px 16px;text-align:right">
                  <input
                    v-if="auth.isAdmin"
                    v-model.number="menu[meal].price"
                    type="number" min="0"
                    class="price-input"
                    :id="`menu-${meal}-price`"
                    @focus="e => e.target.style.borderColor='#16a34a'"
                    @blur="e => e.target.style.borderColor='#e2e8f0'"
                    @input="onMenuChange"
                  />
                  <span v-else style="font-size:14px;font-weight:700">Rs. {{ menu[meal].price }}</span>
                </td>
                <td style="padding:8px 16px;text-align:center">
                  <button
                    v-if="auth.isAdmin"
                    class="nonveg-toggle-btn"
                    :class="{ active: menu[meal].nonVegEnabled }"
                    @click="toggleNonVeg(meal)"
                    :id="`btn-nonveg-${meal}`"
                  >
                    {{ menu[meal].nonVegEnabled ? 'Non-Veg On' : 'Add Non-Veg' }}
                  </button>
                  <span v-else-if="menu[meal].nonVegEnabled" class="type-badge-inline nv-badge">Non-Veg Available</span>
                </td>
                <td v-if="auth.isAdmin && orders.length > 0" style="padding:8px 16px;text-align:center" :rowspan="menu[meal].nonVegEnabled ? 4 : 2">
                  <button
                    class="menu-cancel-btn"
                    :class="{ cancelled: columnSnapshots[meal === 'breakfast' ? 'bf' : meal] !== null }"
                    @click="toggleCancelMeal(meal === 'breakfast' ? 'bf' : meal)"
                    :id="`btn-cancel-${meal}`"
                  >
                    <svg v-if="columnSnapshots[meal === 'breakfast' ? 'bf' : meal] === null" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <svg v-else width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                    </svg>
                    {{ columnSnapshots[meal === 'breakfast' ? 'bf' : meal] === null ? 'Cancel' : 'Restore' }} {{ meal === 'breakfast' ? 'Breakfast' : meal.charAt(0).toUpperCase() + meal.slice(1) }}
                  </button>
                </td>
              </tr>

              <!-- VEG ADDONS sub-row (directly below Veg row) -->
              <tr style="border-bottom:1px solid #f1f5f9;background:rgba(34,197,94,0.02)">
                <td style="padding:8px 16px;font-size:12px;font-weight:700;color:#15803d;padding-left:28px">
                  <span class="type-badge-inline v-badge" style="margin-right:6px">Veg Addons</span>
                </td>
                <td colspan="3" style="padding:6px 16px">
                  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                    <div v-for="(addon, idx) in menu[meal].addons" :key="idx" style="display:inline-flex;gap:4px;align-items:center;background:#fff;border:1px solid #cbd5e1;padding:2px 8px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                      <input
                        v-if="auth.isAdmin"
                        v-model="addon.name"
                        placeholder="Addon name"
                        style="border:none;outline:none;font-size:12px;width:120px;padding:2px"
                        @input="onMenuChange"
                      />
                      <span v-else style="font-size:12px">{{ addon.name }}</span>
                      
                      <span style="font-size:12px;color:#64748b">: Rs.</span>
                      <input
                        v-if="auth.isAdmin"
                        v-model.number="addon.price"
                        type="number" min="0"
                        placeholder="Price"
                        style="border:none;outline:none;font-size:12px;width:50px;padding:2px;text-align:right"
                        @input="onMenuChange"
                      />
                      <span v-else style="font-size:12px;font-weight:700">Rs. {{ addon.price }}</span>

                      <button
                        v-if="auth.isAdmin"
                        style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:11px;padding:0 2px"
                        @click="menu[meal].addons.splice(idx, 1); onMenuChange()"
                      >✕</button>
                    </div>
                    <button
                      v-if="auth.isAdmin"
                      style="font-size:11px;font-weight:600;color:#15803d;background:none;border:1px dashed #86efac;border-radius:4px;padding:3px 8px;cursor:pointer"
                      @click="menu[meal].addons = menu[meal].addons || []; menu[meal].addons.push({ name: '', price: 0 }); onMenuChange()"
                    >+ Add Veg Addon</button>
                    <span v-else-if="!menu[meal].addons || menu[meal].addons.length === 0" style="font-size:12px;color:#94a3b8;font-style:italic">None</span>
                  </div>
                </td>
              </tr>

              <!-- NON-VEG sub-row (shown only when nonVegEnabled) -->
              <tr v-if="menu[meal].nonVegEnabled" style="border-bottom:1px solid #f1f5f9;background:rgba(251,191,36,0.05)">
                <td style="padding:8px 16px;font-size:12px;font-weight:700;color:#b45309;padding-left:28px">
                  <span class="type-badge-inline nv-badge" style="margin-right:6px">Non-Veg</span>
                </td>
                <td style="padding:6px 16px">
                  <input
                    v-if="auth.isAdmin"
                    v-model="menu[meal].nonVegName"
                    :placeholder="`Enter non-veg item name`"
                    class="menu-input nonveg-input"
                    :id="`menu-${meal}-nonveg-name`"
                    @focus="e => e.target.style.borderColor='#f59e0b'"
                    @blur="e => e.target.style.borderColor='#fde68a'"
                    @input="onMenuChange"
                  />
                  <span v-else style="font-size:13px;color:#92400e">{{ menu[meal].nonVegName || '—' }}</span>
                </td>
                <td style="padding:6px 16px;text-align:right">
                  <input
                    v-if="auth.isAdmin"
                    v-model.number="menu[meal].nonVegPrice"
                    type="number" min="0"
                    class="price-input nonveg-input"
                    :id="`menu-${meal}-nonveg-price`"
                    @focus="e => e.target.style.borderColor='#f59e0b'"
                    @blur="e => e.target.style.borderColor='#fde68a'"
                    @input="onMenuChange"
                  />
                  <span v-else style="font-size:13px;font-weight:700;color:#92400e">Rs. {{ menu[meal].nonVegPrice }}</span>
                </td>
                <td></td>
              </tr>

              <!-- NON-VEG ADDONS sub-row (directly below Non-Veg row) -->
              <tr v-if="menu[meal].nonVegEnabled" style="border-bottom:1px solid #f1f5f9;background:rgba(251,191,36,0.02)">
                <td style="padding:8px 16px;font-size:12px;font-weight:700;color:#b45309;padding-left:28px">
                  <span class="type-badge-inline nv-badge" style="margin-right:6px">Non-Veg Addons</span>
                </td>
                <td colspan="3" style="padding:6px 16px">
                  <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                    <div v-for="(addon, idx) in menu[meal].nonVegAddons" :key="idx" style="display:inline-flex;gap:4px;align-items:center;background:#fff;border:1px solid #cbd5e1;padding:2px 8px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,0.05)">
                      <input
                        v-if="auth.isAdmin"
                        v-model="addon.name"
                        placeholder="Addon name"
                        style="border:none;outline:none;font-size:12px;width:120px;padding:2px"
                        @input="onMenuChange"
                      />
                      <span v-else style="font-size:12px">{{ addon.name }}</span>
                      
                      <span style="font-size:12px;color:#64748b">: Rs.</span>
                      <input
                        v-if="auth.isAdmin"
                        v-model.number="addon.price"
                        type="number" min="0"
                        placeholder="Price"
                        style="border:none;outline:none;font-size:12px;width:50px;padding:2px;text-align:right"
                        @input="onMenuChange"
                      />
                      <span v-else style="font-size:12px;font-weight:700">Rs. {{ addon.price }}</span>

                      <button
                        v-if="auth.isAdmin"
                        style="border:none;background:none;color:#ef4444;cursor:pointer;font-size:11px;padding:0 2px"
                        @click="menu[meal].nonVegAddons.splice(idx, 1); onMenuChange()"
                      >✕</button>
                    </div>
                    <button
                      v-if="auth.isAdmin"
                      style="font-size:11px;font-weight:600;color:#b45309;background:none;border:1px dashed #fcd34d;border-radius:4px;padding:3px 8px;cursor:pointer"
                      @click="menu[meal].nonVegAddons = menu[meal].nonVegAddons || []; menu[meal].nonVegAddons.push({ name: '', price: 0 }); onMenuChange()"
                    >+ Add Non-Veg Addon</button>
                    <span v-else-if="!menu[meal].nonVegAddons || menu[meal].nonVegAddons.length === 0" style="font-size:12px;color:#94a3b8;font-style:italic">None</span>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- ── Master Order Sheet ─────────────────────────────────────────── -->
      <div class="order-sheet">

        <!-- Sheet header -->
        <div class="sheet-header">
          <div>
            <h3 style="font-size:14px;font-weight:700;color:#0f172a;letter-spacing:.01em">Master Order Sheet</h3>
            <p style="font-size:12px;color:#475569;margin-top:2px">{{ orders.length }} members &mdash; All batches</p>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span v-if="saving && auth.isAdmin" class="unsaved-badge saving-badge">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation:spin 1s linear infinite;display:inline-block;vertical-align:middle;margin-right:3px"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Saving…
            </span>
            <span v-else-if="unsaved && auth.isAdmin" class="unsaved-badge">Unsaved</span>
          </div>
        </div>

        <!-- Default Qty Toolbar (admin only) -->
        <div v-if="auth.isAdmin && orders.length > 0" class="admin-toolbar">
          <div class="toolbar-section">
            <span class="toolbar-label">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
              Default Qty
            </span>
            <div class="dc-group">
              <div class="dc-item">
                <span class="dc-mealname bf-color">BF</span>
                <input type="number" min="1" max="99" v-model.number="defaultQty.bf" class="dc-input" id="dq-bf" />
              </div>
              <div class="dc-item">
                <span class="dc-mealname lunch-color">LN</span>
                <input type="number" min="1" max="99" v-model.number="defaultQty.lunch" class="dc-input" id="dq-lunch" />
              </div>
              <div class="dc-item">
                <span class="dc-mealname dinner-color">DN</span>
                <input type="number" min="1" max="99" v-model.number="defaultQty.dinner" class="dc-input" id="dq-dinner" />
              </div>
            </div>
            <button class="toolbar-btn apply-btn" @click="applyDefaultQty" id="btn-apply-qty">
              <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              Apply Qty
            </button>
          </div>
        </div>

        <!-- Order scroll area -->
        <div class="order-scroll">
          <div v-if="loading" class="loading-spinner"><div class="spinner"></div> Loading orders...</div>
          <div v-else-if="orders.length === 0" class="empty-state">
            <div class="empty-icon" style="font-size:36px">&#9776;</div>
            <h4>No orders for this date</h4>
            <p style="margin-bottom:16px">Click <strong>"Initialize Orders"</strong> to load all active members for this date.</p>
            <button v-if="auth.isAdmin && !isHoliday" class="btn btn-primary" @click="initOrders" :disabled="loading || initializing" id="btn-init-orders-empty">
              {{ initializing ? 'Initializing…' : 'Initialize Orders' }}
            </button>
          </div>
          <table v-else class="order-table">
            <thead>
              <tr>
                <th rowspan="2" style="width:110px;vertical-align:middle">Batch</th>
                <th rowspan="2" style="vertical-align:middle">Member Name</th>
                <th class="col-meal-group" colspan="3">Breakfast</th>
                <th class="col-meal-group" colspan="3">Lunch</th>
                <th class="col-meal-group" colspan="3">Dinner</th>
                <th v-if="auth.isAdmin" rowspan="2" style="width:60px;text-align:center;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.06em;vertical-align:middle">Cancel</th>
              </tr>
              <tr class="sub-header-row">
                <!-- Breakfast sub-headers -->
                <th class="sub-th bf-color">Count</th>
                <th class="sub-th bf-color">Qty</th>
                <th class="sub-th bf-color">Type</th>
                <!-- Lunch sub-headers -->
                <th class="sub-th lunch-color">Count</th>
                <th class="sub-th lunch-color">Qty</th>
                <th class="sub-th lunch-color">Type</th>
                <!-- Dinner sub-headers -->
                <th class="sub-th dinner-color">Count</th>
                <th class="sub-th dinner-color">Qty</th>
                <th class="sub-th dinner-color">Type</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(group, batchId) in groupedOrders" :key="batchId">
                <!-- Batch group header row -->
                <tr class="batch-row">
                  <td colspan="13">
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%">
                      <div>
                        <span style="font-weight:700">{{ getBatchName(batchId) }}</span>
                        <span class="batch-id-tag">{{ batchId }}</span>
                        <span style="font-weight:400;margin-left:6px;opacity:.65;font-size:11px">({{ group.length }} member{{ group.length > 1 ? 's' : '' }})</span>
                        <span
                          :class="['ms-badge', 'ms-' + (getBatchSchedule(batchId)).toLowerCase()]"
                          :title="mealScheduleLabel(getBatchSchedule(batchId))"
                        >{{ getBatchSchedule(batchId) }}</span>
                      </div>
                      <div v-if="auth.isAdmin" class="batch-actions">
                        <span style="font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; margin-right:4px">Cancel Batch:</span>
                        <button class="batch-cancel-btn bf" :class="{ cancelled: isBatchMealCancelled(batchId, 'breakfast') }" @click="cancelBatchMeal(batchId, 'breakfast')" style="margin-right:4px">
                          {{ isBatchMealCancelled(batchId, 'breakfast') ? 'Restore BF' : 'BF' }}
                        </button>
                        <button class="batch-cancel-btn lunch" :class="{ cancelled: isBatchMealCancelled(batchId, 'lunch') }" @click="cancelBatchMeal(batchId, 'lunch')" style="margin-right:4px">
                          {{ isBatchMealCancelled(batchId, 'lunch') ? 'Restore Lunch' : 'Lunch' }}
                        </button>
                        <button class="batch-cancel-btn dinner" :class="{ cancelled: isBatchMealCancelled(batchId, 'dinner') }" @click="cancelBatchMeal(batchId, 'dinner')">
                          {{ isBatchMealCancelled(batchId, 'dinner') ? 'Restore Dinner' : 'Dinner' }}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Per-member rows -->
                <tr v-for="order in group" :key="order.memberId" :class="['order-row', { cancelled: isCancelled(order) }]">
                  <td class="member-id-cell">{{ order.memberId }}</td>
                  <td class="member-name-cell">
                    {{ order.memberName }}
                    <span v-if="isCancelled(order)" class="cancelled-tag">Cancelled</span>
                    <!-- Addon indicator -->
                    <span v-if="hasAddons(order)" class="addon-indicator-tag" @click.stop="openAddonModal(order)" title="Has addons — click to edit">Addons</span>
                  </td>

                  <!-- ── BREAKFAST ── -->
                  <td style="text-align:center">
                    <input v-if="auth.isAdmin" v-model.number="order.bf" type="number" min="0" max="99" class="num-input" :class="{ zero: order.bf === 0 }" @input="onOrderChange()" :id="`order-${order.memberId}-bf`" />
                    <span v-else class="count-display" :class="{ zero: order.bf === 0 }">{{ order.bf }}</span>
                  </td>
                  <td style="text-align:center">
                    <input v-if="auth.isAdmin" v-model.number="order.bfQty" type="number" :min="order.bf === 0 ? 0 : 1" max="99" class="num-input qty-input" :disabled="order.bf === 0" @input="onOrderChange()" :id="`order-${order.memberId}-bfqty`" />
                    <span v-else class="count-display qty-display">{{ order.bfQty }}</span>
                  </td>
                  <td style="text-align:center">
                    <select v-if="auth.isAdmin && menu.breakfast.nonVegEnabled" v-model="order.bfType" class="type-select" :disabled="order.bf === 0" @change="onOrderChange()" :id="`order-${order.memberId}-bftype`">
                      <option value="veg">V</option>
                      <option value="nonveg">NV</option>
                    </select>
                    <span v-else-if="menu.breakfast.nonVegEnabled" class="type-badge-inline" :class="order.bfType === 'nonveg' ? 'nv-badge' : 'v-badge'">
                      {{ order.bfType === 'nonveg' ? 'NV' : 'V' }}
                    </span>
                    <span v-else class="type-badge-inline v-badge">V</span>
                  </td>

                  <!-- ── LUNCH ── -->
                  <td style="text-align:center">
                    <input v-if="auth.isAdmin" v-model.number="order.lunch" type="number" min="0" max="99" class="num-input" :class="{ zero: order.lunch === 0 }" @input="onOrderChange()" :id="`order-${order.memberId}-lunch`" />
                    <span v-else class="count-display" :class="{ zero: order.lunch === 0 }">{{ order.lunch }}</span>
                  </td>
                  <td style="text-align:center">
                    <input v-if="auth.isAdmin" v-model.number="order.lunchQty" type="number" :min="order.lunch === 0 ? 0 : 1" max="99" class="num-input qty-input" :disabled="order.lunch === 0" @input="onOrderChange()" :id="`order-${order.memberId}-lunchqty`" />
                    <span v-else class="count-display qty-display">{{ order.lunchQty }}</span>
                  </td>
                  <td style="text-align:center">
                    <select v-if="auth.isAdmin && menu.lunch.nonVegEnabled" v-model="order.lunchType" class="type-select" :disabled="order.lunch === 0" @change="onOrderChange()" :id="`order-${order.memberId}-lunchtype`">
                      <option value="veg">V</option>
                      <option value="nonveg">NV</option>
                    </select>
                    <span v-else-if="menu.lunch.nonVegEnabled" class="type-badge-inline" :class="order.lunchType === 'nonveg' ? 'nv-badge' : 'v-badge'">
                      {{ order.lunchType === 'nonveg' ? 'NV' : 'V' }}
                    </span>
                    <span v-else class="type-badge-inline v-badge">V</span>
                  </td>

                  <!-- ── DINNER ── -->
                  <td style="text-align:center">
                    <input v-if="auth.isAdmin" v-model.number="order.dinner" type="number" min="0" max="99" class="num-input" :class="{ zero: order.dinner === 0 }" @input="onOrderChange()" :id="`order-${order.memberId}-dinner`" />
                    <span v-else class="count-display" :class="{ zero: order.dinner === 0 }">{{ order.dinner }}</span>
                  </td>
                  <td style="text-align:center">
                    <input v-if="auth.isAdmin" v-model.number="order.dinnerQty" type="number" :min="order.dinner === 0 ? 0 : 1" max="99" class="num-input qty-input" :disabled="order.dinner === 0" @input="onOrderChange()" :id="`order-${order.memberId}-dinnerqty`" />
                    <span v-else class="count-display qty-display">{{ order.dinnerQty }}</span>
                  </td>
                  <td style="text-align:center">
                    <select v-if="auth.isAdmin && menu.dinner.nonVegEnabled" v-model="order.dinnerType" class="type-select" :disabled="order.dinner === 0" @change="onOrderChange()" :id="`order-${order.memberId}-dinnertype`">
                      <option value="veg">V</option>
                      <option value="nonveg">NV</option>
                    </select>
                    <span v-else-if="menu.dinner.nonVegEnabled" class="type-badge-inline" :class="order.dinnerType === 'nonveg' ? 'nv-badge' : 'v-badge'">
                      {{ order.dinnerType === 'nonveg' ? 'NV' : 'V' }}
                    </span>
                    <span v-else class="type-badge-inline v-badge">V</span>
                  </td>

                  <!-- Per-row cancel/restore + addon button -->
                  <td v-if="auth.isAdmin" style="text-align:center;white-space:nowrap">
                    <button class="addon-mini-btn" @click="openAddonModal(order)" title="Manage addons" :class="{ 'has-addon': hasAddons(order) }">
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </button>
                    <button v-if="!isCancelled(order)" class="row-cancel-btn" @click="cancelRow(order)" :title="`Cancel all meals for ${order.memberName}`">
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    <button v-else class="row-restore-btn" @click="restoreRow(order)" :title="`Restore default for ${order.memberName}`">
                      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ── Totals Section ─────────────────────────────────────────────── -->
      <div v-if="orders.length > 0" class="totals-grid">
        <div class="totals-card">
          <div class="totals-title" style="font-weight:700;font-size:13px;color:#0f172a">Meal Count Totals</div>
          <table class="totals-table">
            <tbody>
              <tr><td class="label-col">Breakfast Count</td><td class="value-col">{{ totals.bf }}</td></tr>
              <tr><td class="label-col">Lunch Count</td><td class="value-col">{{ totals.lunch }}</td></tr>
              <tr><td class="label-col">Dinner Count</td><td class="value-col">{{ totals.dinner }}</td></tr>
              <tr class="total-row">
                <td class="label-col">Total Meals</td>
                <td class="value-col">{{ totals.bf + totals.lunch + totals.dinner }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="totals-card">
          <div class="totals-title" style="font-weight:700;font-size:13px;color:#0f172a">Income Estimate</div>
          <table class="totals-table">
            <tbody>
              <tr>
                <td class="label-col">Breakfast Veg ({{ totals.bfVeg }} × Rs. {{ menu.breakfast.price }})</td>
                <td class="value-col">Rs. {{ (totals.bfVeg * menu.breakfast.price).toLocaleString() }}</td>
              </tr>
              <tr v-if="menu.breakfast.nonVegEnabled">
                <td class="label-col">Breakfast Non-Veg ({{ totals.bfNonVeg }} × Rs. {{ menu.breakfast.nonVegPrice }})</td>
                <td class="value-col">Rs. {{ (totals.bfNonVeg * menu.breakfast.nonVegPrice).toLocaleString() }}</td>
              </tr>
              <tr>
                <td class="label-col">Lunch Veg ({{ totals.lunchVeg }} × Rs. {{ menu.lunch.price }})</td>
                <td class="value-col">Rs. {{ (totals.lunchVeg * menu.lunch.price).toLocaleString() }}</td>
              </tr>
              <tr v-if="menu.lunch.nonVegEnabled">
                <td class="label-col">Lunch Non-Veg ({{ totals.lunchNonVeg }} × Rs. {{ menu.lunch.nonVegPrice }})</td>
                <td class="value-col">Rs. {{ (totals.lunchNonVeg * menu.lunch.nonVegPrice).toLocaleString() }}</td>
              </tr>
              <tr>
                <td class="label-col">Dinner Veg ({{ totals.dinnerVeg }} × Rs. {{ menu.dinner.price }})</td>
                <td class="value-col">Rs. {{ (totals.dinnerVeg * menu.dinner.price).toLocaleString() }}</td>
              </tr>
              <tr v-if="menu.dinner.nonVegEnabled">
                <td class="label-col">Dinner Non-Veg ({{ totals.dinnerNonVeg }} × Rs. {{ menu.dinner.nonVegPrice }})</td>
                <td class="value-col">Rs. {{ (totals.dinnerNonVeg * menu.dinner.nonVegPrice).toLocaleString() }}</td>
              </tr>
              <tr v-if="totals.addonIncome > 0">
                <td class="label-col">Addons Total</td>
                <td class="value-col">Rs. {{ totals.addonIncome.toLocaleString() }}</td>
              </tr>
              <tr class="income-row">
                <td class="label-col">Total Income</td>
                <td class="value-col">Rs. {{ totalIncome.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Addon Modal ──────────────────────────────────────────────────── -->
    <div v-if="addonModal.open" class="modal-overlay" @click.self="closeAddonModal">
      <div class="modal" style="max-width:560px;padding:0">
        <div style="padding:18px 24px 14px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between">
          <div>
            <h3 style="font-size:15px;font-weight:700;margin:0">Addons — {{ addonModal.order?.memberName }}</h3>
            <p style="font-size:12px;color:#64748b;margin:3px 0 0">{{ addonModal.order?.memberId }} · Per-member add-on items</p>
          </div>
          <button class="btn btn-secondary btn-sm" @click="closeAddonModal">Close</button>
        </div>

        <div style="padding:18px 24px">
          <div v-for="meal in ['bf','lunch','dinner']" :key="meal" style="margin-bottom:20px">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-bottom:8px">
              {{ meal === 'bf' ? 'Breakfast' : meal === 'lunch' ? 'Lunch' : 'Dinner' }} Addons
            </div>
            <div v-for="(addon, idx) in addonModal.order[meal + 'Addons']" :key="idx" style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
              <input
                v-model="addon.name"
                placeholder="Addon name (e.g. Chicken Gravy)"
                style="flex:1;padding:6px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-family:inherit;outline:none"
                @focus="e => e.target.style.borderColor='#2563eb'"
                @blur="e => e.target.style.borderColor='#e2e8f0'"
                @input="onOrderChange()"
              />
              <input
                v-model.number="addon.price"
                type="number" min="0"
                placeholder="Price"
                style="width:80px;padding:6px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:13px;font-family:inherit;text-align:right;outline:none"
                @focus="e => e.target.style.borderColor='#2563eb'"
                @blur="e => e.target.style.borderColor='#e2e8f0'"
                @input="onOrderChange()"
              />
              <button
                style="width:28px;height:28px;border-radius:6px;border:1px solid rgba(239,68,68,0.3);color:#ef4444;background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center"
                @click="removeAddon(meal, idx)"
              >✕</button>
            </div>
            <!-- Predefined Addons for Quick Add -->
            <div v-if="getMenuAddons(meal, addonModal.order).length > 0" style="margin-bottom:8px;display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <span style="font-size:11px;color:#64748b;font-weight:500">Quick Add:</span>
              <button
                v-for="predefined in getMenuAddons(meal, addonModal.order)"
                :key="predefined.name"
                class="btn btn-secondary btn-sm"
                style="padding:2px 8px;font-size:11px;border-radius:4px"
                @click="addPredefinedAddon(meal, predefined)"
              >
                {{ predefined.name }} (Rs. {{ predefined.price }})
              </button>
            </div>
            
            <button
              style="font-size:12px;font-weight:600;color:#2563eb;background:none;border:1px dashed #93c5fd;border-radius:6px;padding:5px 12px;cursor:pointer"
              @click="addAddon(meal)"
            >+ Add Addon</button>
          </div>
        </div>

        <div style="padding:14px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end">
          <button class="btn btn-primary" @click="closeAddonModal">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../store/auth'
import { useBatchStore } from '../store/batch'
import api from '../services/api'

const auth       = useAuthStore()
const batchStore = useBatchStore()

const today        = new Date()
const selectedDate = ref(today.toISOString().split('T')[0])
const loading          = ref(false)
const saving           = ref(false)
const initializing     = ref(false)
const unsaved          = ref(false)
let   autoSaveTimer    = null
const alert        = ref({ msg: '', type: 'success' })

const isHoliday       = ref(false)
const togglingHoliday = ref(false)

const displayDate = computed(() => {
  const d = new Date(selectedDate.value + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
})
const dayName = computed(() =>
  new Date(selectedDate.value + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })
)

// ── Menu state (extended with nonVeg fields) ──────────────────────────────────
const menu = ref({
  breakfast: { name: '', price: 0, nonVegEnabled: false, nonVegName: '', nonVegPrice: 0, addons: [], nonVegAddons: [] },
  lunch:     { name: '', price: 0, nonVegEnabled: false, nonVegName: '', nonVegPrice: 0, addons: [], nonVegAddons: [] },
  dinner:    { name: '', price: 0, nonVegEnabled: false, nonVegName: '', nonVegPrice: 0, addons: [], nonVegAddons: [] }
})

const orders       = ref([])
const defaultQty   = ref({ bf: 1, lunch: 1, dinner: 1 })

// Store "original" defaults per member to allow restore after cancel
const memberDefaults  = ref({})
const columnSnapshots = ref({ bf: null, lunch: null, dinner: null })

// ── Addon modal state ─────────────────────────────────────────────────────────
const addonModal = ref({ open: false, order: null })

function openAddonModal(order) {
  // Ensure addon arrays exist
  if (!order.bfAddons)     order.bfAddons     = []
  if (!order.lunchAddons)  order.lunchAddons  = []
  if (!order.dinnerAddons) order.dinnerAddons = []
  addonModal.value = { open: true, order }
}
function closeAddonModal() {
  addonModal.value = { open: false, order: null }
  recalcTotals()
}
function addAddon(meal) {
  const key = meal + 'Addons'
  if (!addonModal.value.order[key]) addonModal.value.order[key] = []
  addonModal.value.order[key].push({ name: '', price: 0 })
  onOrderChange()
}
function removeAddon(meal, idx) {
  const key = meal + 'Addons'
  addonModal.value.order[key].splice(idx, 1)
  onOrderChange()
}
function hasAddons(order) {
  return (order.bfAddons?.length > 0 || order.lunchAddons?.length > 0 || order.dinnerAddons?.length > 0)
}
function getMenuAddons(mealKey, order) {
  if (!order) return []
  const mealName = mealKey === 'bf' ? 'breakfast' : mealKey
  const type = order[mealKey + 'Type'] || 'veg'
  const mealMenu = menu.value[mealName] || {}
  if (type === 'nonveg') {
    return mealMenu.nonVegAddons || []
  }
  return mealMenu.addons || []
}
function addPredefinedAddon(meal, predefined) {
  const key = meal + 'Addons'
  if (!addonModal.value.order[key]) addonModal.value.order[key] = []
  addonModal.value.order[key].push({ name: predefined.name, price: predefined.price })
  onOrderChange()
}

// ── Grouped orders ────────────────────────────────────────────────────────────
const groupedOrders = computed(() => {
  const groups = {}
  for (const o of orders.value) {
    if (!groups[o.batchId]) groups[o.batchId] = []
    groups[o.batchId].push(o)
  }
  return groups
})

// ── Totals (extended for veg/nonveg/addons) ───────────────────────────────────
const totals = ref({
  bf: 0, lunch: 0, dinner: 0,
  bfVeg: 0, bfNonVeg: 0,
  lunchVeg: 0, lunchNonVeg: 0,
  dinnerVeg: 0, dinnerNonVeg: 0,
  addonIncome: 0
})

const totalIncome = computed(() => {
  const m = menu.value
  return (
    totals.value.bfVeg    * m.breakfast.price +
    totals.value.bfNonVeg * m.breakfast.nonVegPrice +
    totals.value.lunchVeg    * m.lunch.price +
    totals.value.lunchNonVeg * m.lunch.nonVegPrice +
    totals.value.dinnerVeg    * m.dinner.price +
    totals.value.dinnerNonVeg * m.dinner.nonVegPrice +
    totals.value.addonIncome
  )
})

function recalcTotals() {
  let bf = 0, lunch = 0, dinner = 0
  let bfVeg = 0, bfNonVeg = 0
  let lunchVeg = 0, lunchNonVeg = 0
  let dinnerVeg = 0, dinnerNonVeg = 0
  let addonIncome = 0

  const m = menu.value || {}

  for (const o of orders.value) {
    const bfC     = Number(o.bf)     || 0
    const lunchC  = Number(o.lunch)  || 0
    const dinnerC = Number(o.dinner) || 0
    const bfQ     = Number(o.bfQty)     || 1
    const lunchQ  = Number(o.lunchQty)  || 1
    const dinnerQ = Number(o.dinnerQty) || 1

    bf     += bfC
    lunch  += lunchC
    dinner += dinnerC

    if (o.bfType === 'nonveg') bfNonVeg += bfC * bfQ
    else                        bfVeg    += bfC * bfQ

    if (o.lunchType === 'nonveg') lunchNonVeg += lunchC * lunchQ
    else                           lunchVeg    += lunchC * lunchQ

    if (o.dinnerType === 'nonveg') dinnerNonVeg += dinnerC * dinnerQ
    else                            dinnerVeg    += dinnerC * dinnerQ

    // Addon income
    let bfAddons = o.bfAddons || []
    if (bfAddons.length === 0 && bfC > 0 && m.breakfast) {
      bfAddons = o.bfType === 'nonveg' ? (m.breakfast.nonVegAddons || []) : (m.breakfast.addons || [])
    }
    bfAddons.forEach(a => { addonIncome += bfC * (Number(a.price) || 0) })


    let lunchAddons = o.lunchAddons || []
    if (lunchAddons.length === 0 && lunchC > 0 && m.lunch) {
      lunchAddons = o.lunchType === 'nonveg' ? (m.lunch.nonVegAddons || []) : (m.lunch.addons || [])
    }
    lunchAddons.forEach(a => { addonIncome += lunchC * (Number(a.price) || 0) })


    let dinnerAddons = o.dinnerAddons || []
    if (dinnerAddons.length === 0 && dinnerC > 0 && m.dinner) {
      dinnerAddons = o.dinnerType === 'nonveg' ? (m.dinner.nonVegAddons || []) : (m.dinner.addons || [])
    }
    dinnerAddons.forEach(a => { addonIncome += dinnerC * (Number(a.price) || 0) })

  }

  totals.value = { bf, lunch, dinner, bfVeg, bfNonVeg, lunchVeg, lunchNonVeg, dinnerVeg, dinnerNonVeg, addonIncome }
}

function onOrderChange() {
  for (const o of orders.value) {
    if (Number(o.bf) === 0) o.bfQty = 0
    else if (Number(o.bf) > 0 && Number(o.bfQty) === 0) o.bfQty = 1

    if (Number(o.lunch) === 0) o.lunchQty = 0
    else if (Number(o.lunch) > 0 && Number(o.lunchQty) === 0) o.lunchQty = 1

    if (Number(o.dinner) === 0) o.dinnerQty = 0
    else if (Number(o.dinner) > 0 && Number(o.dinnerQty) === 0) o.dinnerQty = 1
  }
  recalcTotals()
  unsaved.value = true
  // Debounced auto-save: wait 1.5s of inactivity then save
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => { if (unsaved.value) saveAll() }, 1500)
}

function onMenuChange() {
  recalcTotals()
  unsaved.value = true
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(() => { if (unsaved.value) saveAll() }, 1500)
}

// ── Batch helpers ─────────────────────────────────────────────────────────────
function getBatchName(batchId) {
  const b = batchStore.batches.find(x => x.batchId === batchId)
  return b ? b.batchName : batchId
}

const MEAL_SCHEDULE_LABELS = {
  BLD: 'Breakfast, Lunch & Dinner',
  BL:  'Breakfast & Lunch',
  BD:  'Breakfast & Dinner',
  LD:  'Lunch & Dinner',
  L:   'Lunch only',
  BF:  'Breakfast only',
}

function getBatchSchedule(batchId) {
  const b = batchStore.batches.find(x => x.batchId === batchId)
  return (b && b.mealSchedule) ? b.mealSchedule : 'BLD'
}

function mealScheduleLabel(code) {
  return MEAL_SCHEDULE_LABELS[code] || 'All Meals'
}

// ── Cancel / Restore helpers ──────────────────────────────────────────────────
function isCancelled(order) {
  return order.bf === 0 && order.lunch === 0 && order.dinner === 0
}

function cancelRow(order) {
  memberDefaults.value[order.memberId] = {
    bf: order.bf, lunch: order.lunch, dinner: order.dinner,
    bfQty: order.bfQty, lunchQty: order.lunchQty, dinnerQty: order.dinnerQty
  }
  order.bf = 0; order.lunch = 0; order.dinner = 0
  onOrderChange()
}

function restoreRow(order) {
  const def = memberDefaults.value[order.memberId]
  if (def) {
    order.bf = def.bf; order.lunch = def.lunch; order.dinner = def.dinner
    order.bfQty = order.bf === 0 ? 0 : (def.bfQty || 1)
    order.lunchQty = order.lunch === 0 ? 0 : (def.lunchQty || 1)
    order.dinnerQty = order.dinner === 0 ? 0 : (def.dinnerQty || 1)
  } else {
    order.bf    = 1
    order.lunch = 1
    order.dinner= 1
    order.bfQty    = defaultQty.value.bf || 1
    order.lunchQty = defaultQty.value.lunch || 1
    order.dinnerQty= defaultQty.value.dinner || 1
  }
  onOrderChange()
}

function toggleNonVeg(meal) {
  const nextVal = !menu.value[meal].nonVegEnabled
  menu.value[meal].nonVegEnabled = nextVal
  if (nextVal) {
    const typeKey = meal === 'breakfast' ? 'bfType' : meal + 'Type'
    const countKey = meal === 'breakfast' ? 'bf' : meal
    orders.value.forEach(o => {
      if (o[countKey] > 0 && (!o[typeKey] || o[typeKey] === 'veg')) {
        o[typeKey] = 'nonveg'
      }
    })
  } else {
    const typeKey = meal === 'breakfast' ? 'bfType' : meal + 'Type'
    orders.value.forEach(o => {
      o[typeKey] = 'veg'
    })
  }
  onMenuChange()
}

// ── Cancel/Restore entire meal column ─────────────────────────────────────────
function toggleCancelMeal(type) {
  if (columnSnapshots.value[type] === null) {
    columnSnapshots.value[type] = orders.value.map(o => ({ memberId: o.memberId, value: o[type] }))
    for (const o of orders.value) o[type] = 0
  } else {
    for (const o of orders.value) {
      const snap = columnSnapshots.value[type].find(s => s.memberId === o.memberId)
      if (snap) o[type] = snap.value
    }
    columnSnapshots.value[type] = null
  }
  onMenuChange()
}

// ── Cancel/Restore entire batch meal ──────────────────────────────────────────
function cancelBatchMeal(batchId, meal) {
  const countKey = meal === 'breakfast' ? 'bf' : meal === 'lunch' ? 'lunch' : 'dinner'
  const qtyKey = meal === 'breakfast' ? 'bfQty' : meal === 'lunch' ? 'lunchQty' : 'dinnerQty'

  // Find all orders in the batch
  const batchOrders = orders.value.filter(o => o.batchId === batchId)
  if (batchOrders.length === 0) return

  // Check if all of them are currently 0. If they are all 0, we restore. Otherwise, cancel.
  const allZero = batchOrders.every(o => o[countKey] === 0)

  if (allZero) {
    batchOrders.forEach(o => {
      const def = memberDefaults.value[o.memberId]
      if (def) {
        o[countKey] = def[countKey]
        o[qtyKey] = o[countKey] === 0 ? 0 : (def[qtyKey] || 1)
      } else {
        o[countKey] = 1
        o[qtyKey] = defaultQty.value[countKey] || 1
      }
    })
  } else {
    batchOrders.forEach(o => {
      // Store current values in memberDefaults if they are not already stored, so restoreRow/cancelBatchMeal can restore them
      if (!memberDefaults.value[o.memberId]) {
        memberDefaults.value[o.memberId] = {
          bf: o.bf, lunch: o.lunch, dinner: o.dinner,
          bfQty: o.bfQty, lunchQty: o.lunchQty, dinnerQty: o.dinnerQty
        }
      }
      o[countKey] = 0
      o[qtyKey] = 0
    })
  }

  onOrderChange()
}

function isBatchMealCancelled(batchId, meal) {
  const countKey = meal === 'breakfast' ? 'bf' : meal === 'lunch' ? 'lunch' : 'dinner'
  const batchOrders = orders.value.filter(o => o.batchId === batchId)
  if (batchOrders.length === 0) return false
  return batchOrders.every(o => o[countKey] === 0)
}

// ── Apply default quantity to all rows ────────────────────────────────────────
function applyDefaultQty() {
  for (const o of orders.value) {
    o.bfQty    = o.bf === 0 ? 0 : (Number(defaultQty.value.bf)     || 1)
    o.lunchQty = o.lunch === 0 ? 0 : (Number(defaultQty.value.lunch)  || 1)
    o.dinnerQty= o.dinner === 0 ? 0 : (Number(defaultQty.value.dinner) || 1)
  }
  recalcTotals(); unsaved.value = true
}

// ── Holiday helpers ───────────────────────────────────────────────────────────
async function checkHolidayStatus() {
  try {
    const res = await api.get(`/orders/holiday/check/${selectedDate.value}`)
    isHoliday.value = res.data.isHoliday
  } catch (e) {
    console.error('Failed to check holiday status:', e)
  }
}

async function toggleHoliday() {
  togglingHoliday.value = true
  const nextStatus = !isHoliday.value
  try {
    const res = await api.post('/orders/holiday/toggle', {
      date: selectedDate.value,
      isHoliday: nextStatus
    })
    isHoliday.value = res.data.isHoliday
    showAlert(res.data.message, 'success')
    await loadData()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to toggle holiday.', 'error')
  } finally {
    togglingHoliday.value = false
  }
}

// ── Data loading ──────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true; unsaved.value = false
  try {
    await batchStore.fetchBatches()
    await checkHolidayStatus()
    const [menuRes, ordersRes] = await Promise.allSettled([
      api.get(`/menu/${selectedDate.value}`),
      api.get(`/orders/${selectedDate.value}`)
    ])
    if (menuRes.status === 'fulfilled' && menuRes.value.data) {
      const m = menuRes.value.data
      menu.value = {
        breakfast: {
          name: m.breakfast?.name || '', price: m.breakfast?.price || 0,
          nonVegEnabled: m.breakfast?.nonVegEnabled || false,
          nonVegName:    m.breakfast?.nonVegName    || '',
          nonVegPrice:   m.breakfast?.nonVegPrice   || 0,
          addons:        m.breakfast?.addons        || [],
          nonVegAddons:  m.breakfast?.nonVegAddons   || []
        },
        lunch: {
          name: m.lunch?.name || '', price: m.lunch?.price || 0,
          nonVegEnabled: m.lunch?.nonVegEnabled || false,
          nonVegName:    m.lunch?.nonVegName    || '',
          nonVegPrice:   m.lunch?.nonVegPrice   || 0,
          addons:        m.lunch?.addons        || [],
          nonVegAddons:  m.lunch?.nonVegAddons   || []
        },
        dinner: {
          name: m.dinner?.name || '', price: m.dinner?.price || 0,
          nonVegEnabled: m.dinner?.nonVegEnabled || false,
          nonVegName:    m.dinner?.nonVegName    || '',
          nonVegPrice:   m.dinner?.nonVegPrice   || 0,
          addons:        m.dinner?.addons        || [],
          nonVegAddons:  m.dinner?.nonVegAddons   || []
        }
      }
    } else {
      menu.value = {
        breakfast: { name: '', price: 0, nonVegEnabled: false, nonVegName: '', nonVegPrice: 0, addons: [], nonVegAddons: [] },
        lunch:     { name: '', price: 0, nonVegEnabled: false, nonVegName: '', nonVegPrice: 0, addons: [], nonVegAddons: [] },
        dinner:    { name: '', price: 0, nonVegEnabled: false, nonVegName: '', nonVegPrice: 0, addons: [], nonVegAddons: [] }
      }
    }
    if (ordersRes.status === 'fulfilled' && ordersRes.value.data.length > 0) {
      orders.value = ordersRes.value.data.map(o => ({
        ...o,
        bfQty:        o.bf === 0 ? 0 : (o.bfQty ?? 1),
        lunchQty:     o.lunch === 0 ? 0 : (o.lunchQty ?? 1),
        dinnerQty:    o.dinner === 0 ? 0 : (o.dinnerQty ?? 1),
        bfType:       o.bfType     || 'veg',
        lunchType:    o.lunchType  || 'veg',
        dinnerType:   o.dinnerType || 'veg',
        bfAddons:     o.bfAddons     || [],
        lunchAddons:  o.lunchAddons  || [],
        dinnerAddons: o.dinnerAddons || []
      }))
      columnSnapshots.value = { bf: null, lunch: null, dinner: null }
      memberDefaults.value = {}
      for (const o of orders.value) {
        memberDefaults.value[o.memberId] = {
          bf: o.bf, lunch: o.lunch, dinner: o.dinner,
          bfQty: o.bfQty, lunchQty: o.lunchQty, dinnerQty: o.dinnerQty
        }
      }
    } else {
      orders.value = []
    }
    recalcTotals()
  } finally {
    loading.value = false
  }
}

// Initialize orders manually: called when clicking the "Initialize Orders" button
async function initOrders() {
  if (orders.value.length > 0) {
    const ok = window.confirm("Are you sure you want to re-initialize orders for this date? This will reset all current changes to defaults.")
    if (!ok) return
  }
  initializing.value = true
  try {
    const res = await api.get(`/orders/init/${selectedDate.value}`)
    orders.value = res.data.map(o => ({
      ...o,
      bfQty: o.bf === 0 ? 0 : (o.bfQty ?? 1),
      lunchQty: o.lunch === 0 ? 0 : (o.lunchQty ?? 1),
      dinnerQty: o.dinner === 0 ? 0 : (o.dinnerQty ?? 1),
      bfType: o.bfType || 'veg', lunchType: o.lunchType || 'veg', dinnerType: o.dinnerType || 'veg',
      bfAddons: o.bfAddons || [], lunchAddons: o.lunchAddons || [], dinnerAddons: o.dinnerAddons || []
    }))
    columnSnapshots.value = { bf: null, lunch: null, dinner: null }
    memberDefaults.value = {}
    for (const o of orders.value) {
      memberDefaults.value[o.memberId] = {
        bf: o.bf, lunch: o.lunch, dinner: o.dinner,
        bfQty: o.bfQty, lunchQty: o.lunchQty, dinnerQty: o.dinnerQty
      }
    }
    recalcTotals()
    showAlert(`Initialized ${res.data.length} member orders.`, 'success')
    unsaved.value = true
    // Immediately auto-save the freshly initialized orders so the button disappears and state persists
    await saveAll()
  } catch (e) {
    showAlert(e.response?.data?.message || 'Failed to initialize member orders.', 'error')
  } finally {
    initializing.value = false
  }
}

async function saveAll() {
  saving.value = true
  try {
    const res = await api.post('/orders', {
      date: selectedDate.value,
      orders: orders.value.map(o => ({
        batchId:    o.batchId,
        memberId:   o.memberId,
        memberName: o.memberName,
        bf:         Number(o.bf)     || 0,
        lunch:      Number(o.lunch)  || 0,
        dinner:     Number(o.dinner) || 0,
        bfQty:      Number(o.bf) === 0 ? 0 : (Number(o.bfQty) || 1),
        lunchQty:   Number(o.lunch) === 0 ? 0 : (Number(o.lunchQty) || 1),
        dinnerQty:  Number(o.dinner) === 0 ? 0 : (Number(o.dinnerQty) || 1),
        bfType:     o.bfType     || 'veg',
        lunchType:  o.lunchType  || 'veg',
        dinnerType: o.dinnerType || 'veg',
        bfAddons:     o.bfAddons     || [],
        lunchAddons:  o.lunchAddons  || [],
        dinnerAddons: o.dinnerAddons || []
      })),
      menu: menu.value
    })
    unsaved.value = false
    columnSnapshots.value = { bf: null, lunch: null, dinner: null }
    showAlert(
      `Saved. BF: ${res.data.bfTotal} | Lunch: ${res.data.lunchTotal} | Dinner: ${res.data.dinnerTotal} | Income: Rs. ${res.data.income.toLocaleString()}`,
      'success'
    )
  } catch (e) {
    const msg = e.response?.data?.message
      || (e.message === 'Network Error' ? 'Network error — check your connection or server status.' : e.message)
      || 'Save failed.'
    showAlert(msg, 'error')
    console.error('[SaveAll Error]', e)
  } finally {
    saving.value = false
  }
}

function goToday()       { selectedDate.value = new Date().toISOString().split('T')[0] }
function onDateChange(e) { selectedDate.value = e.target.value }

function showAlert(msg, type) {
  alert.value = { msg, type }
  setTimeout(() => alert.value.msg = '', 6000)
}

watch(selectedDate, () => loadData())
onMounted(() => loadData())
</script>

<style scoped>
/* ── Type Badges instead of Emojis ───────────────────────────────────────── */
.type-badge-inline {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .02em;
}
.type-badge-inline.v-badge {
  background: #dcfce7;
  color: #15803d;
}
.type-badge-inline.nv-badge {
  background: #fef3c7;
  color: #b45309;
}
.type-badge-inline.addon-badge {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

/* ── Meal Schedule Badges ─────────────────────────────────────────────────── */
.ms-badge {
  display: inline-flex; align-items: center;
  margin-left: 10px; padding: 2px 8px;
  border-radius: 999px; font-size: 10px; font-weight: 800;
  letter-spacing: .06em; vertical-align: middle; cursor: default;
}
.ms-bld { background: rgba(34,197,94,0.18);  color: #16a34a; }
.ms-bl  { background: rgba(59,130,246,0.18); color: #1d4ed8; }
.ms-bd  { background: rgba(139,92,246,0.18); color: #6d28d9; }
.ms-ld  { background: rgba(234,179,8,0.20);  color: #92400e; }
.ms-l   { background: rgba(239,68,68,0.15);  color: #b91c1c; }
.ms-bf  { background: rgba(249,115,22,0.15); color: #c2410c; }

/* ── Unsaved badge ────────────────────────────────────────────────────────── */
.unsaved-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #0f172a;
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.saving-badge {
  background: #334155;
  color: #e2e8f0;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Batch ID tag ─────────────────────────────────────────────────────────── */
.batch-id-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 7px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  color: #334155;
  font-weight: 700;
}

/* ── Meal column colors ───────────────────────────────────────────────────── */
.bf-color     { color: #f97316; }
.lunch-color  { color: #10b981; }
.dinner-color { color: #8b5cf6; }

/* ── Sub-header row ──────────────────────────────────────────────────────── */
.col-meal-group {
  text-align: center;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: .06em;
  border-bottom: 1px solid #e2e8f0;
}
.sub-header-row th {
  padding: 4px 8px;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  text-align: center;
}
.sub-th { min-width: 52px; }

/* ── Cancelled row styling ────────────────────────────────────────────────── */
.order-row.cancelled { background: #fef2f2; opacity: 0.75; }
.order-row.cancelled .member-name-cell { color: #94a3b8; }
.cancelled-tag {
  display: inline-block; margin-left: 8px;
  padding: 1px 6px; border-radius: 4px;
  background: #fee2e2; color: #ef4444;
  font-size: 10px; font-weight: 700; letter-spacing: .04em;
}
.addon-indicator-tag {
  display: inline-block; margin-left: 6px;
  padding: 1px 7px; border-radius: 4px;
  background: #eff6ff; color: #2563eb;
  font-size: 10px; font-weight: 700; cursor: pointer;
  border: 1px solid #bfdbfe;
}
.addon-indicator-tag:hover { background: #dbeafe; }

/* ── Member cells ─────────────────────────────────────────────────────────── */
.member-id-cell { color: #94a3b8; font-size: 12px; font-family: monospace; }
.member-name-cell { font-weight: 600; }

/* ── Number inputs ────────────────────────────────────────────────────────── */
.count-display { font-weight: 700; font-size: 14px; }
.count-display.zero { color: #94a3b8; }
.qty-display { color: #6366f1; font-size: 12px; }

.num-input {
  width: 48px; padding: 4px 6px;
  border: 1.5px solid #e2e8f0; border-radius: 6px;
  font-size: 13px; font-weight: 700; text-align: center;
  font-family: inherit; color: #0f172a; background: #ffffff;
  outline: none; transition: border-color 0.15s;
}
.num-input:focus { border-color: #2563eb; }
.num-input.zero { color: #94a3b8; }
.qty-input { border-color: #ddd6fe; color: #6366f1; }
.qty-input:focus { border-color: #6366f1; }

/* ── Type select / badge ──────────────────────────────────────────────────── */
.type-select {
  padding: 3px 4px; border: 1.5px solid #e2e8f0; border-radius: 5px;
  font-size: 12px; font-family: inherit; outline: none; cursor: pointer;
  background: #fff; transition: border-color 0.15s;
}
.type-select:focus { border-color: #2563eb; }
.type-badge { font-size: 14px; cursor: default; }
.v-badge  { color: #16a34a; }
.nv-badge { color: #b45309; }

/* ── Per-row cancel/restore/addon buttons ────────────────────────────────── */
.row-cancel-btn, .row-restore-btn, .addon-mini-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  border-radius: 6px; border: 1px solid;
  cursor: pointer; transition: all 0.15s;
  background: none; margin: 0 1px;
}
.addon-mini-btn {
  border-color: rgba(99,102,241,0.3); color: #6366f1; font-size: 13px;
}
.addon-mini-btn.has-addon { background: rgba(99,102,241,0.1); border-color: #6366f1; }
.addon-mini-btn:hover { background: rgba(99,102,241,0.15); transform: scale(1.1); }
.row-cancel-btn  { border-color: rgba(239,68,68,0.3); color: #ef4444; }
.row-cancel-btn:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.5); transform: scale(1.1); }
.row-restore-btn { border-color: rgba(16,185,129,0.3); color: #10b981; }
.row-restore-btn:hover { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.5); transform: scale(1.1); }

/* ── Menu input styles ────────────────────────────────────────────────────── */
.menu-input {
  width: 100%; padding: 7px 10px;
  border: 1.5px solid #e2e8f0; border-radius: 6px;
  font-size: 13.5px; font-family: inherit; outline: none;
  transition: border-color .15s;
}
.price-input {
  width: 90px; padding: 7px 10px;
  border: 1.5px solid #e2e8f0; border-radius: 6px;
  font-size: 14px; font-weight: 700; text-align: right;
  font-family: inherit; outline: none; transition: border-color .15s;
}
.nonveg-input { border-color: #fde68a; background: #fffbeb; }

/* ── Non-Veg toggle button ────────────────────────────────────────────────── */
.nonveg-toggle-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 6px; cursor: pointer;
  font-size: 12px; font-weight: 600; font-family: inherit;
  border: 1.5px solid #fde68a; background: #fffbeb; color: #92400e;
  transition: all 0.15s ease;
}
.nonveg-toggle-btn:hover { background: #fef3c7; border-color: #f59e0b; }
.nonveg-toggle-btn.active { background: #f59e0b; border-color: #f59e0b; color: #ffffff; }
.nonveg-badge { font-size: 12px; color: #b45309; font-weight: 600; }

/* ── Menu cancel button style ────────────────────────────────────────────── */
.menu-cancel-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; padding: 6px 12px; border-radius: 6px;
  font-size: 12px; font-weight: 600; font-family: inherit;
  cursor: pointer; width: 160px;
  background: #0f172a; border: 1.5px solid #0f172a; color: #ffffff;
  transition: all 0.15s ease;
}
.menu-cancel-btn:hover { background: #1e293b; border-color: #1e293b; }
.menu-cancel-btn.cancelled { background: #ffffff; border-color: #cbd5e1; color: #0f172a; }
.menu-cancel-btn.cancelled:hover { background: #f8fafc; border-color: #cbd5e1; }

/* ── Admin Toolbar ────────────────────────────────────────────────────────── */
.admin-toolbar {
  display: flex; align-items: center;
  background: #ffffff; border-bottom: 1.5px solid #e2e8f0;
  padding: 12px 16px; flex-wrap: wrap; gap: 12px;
}
.toolbar-section { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.toolbar-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 11.5px; font-weight: 700; color: #0f172a;
  text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
}
.toolbar-divider { width: 1px; height: 24px; background: #e2e8f0; margin: 0 4px; }
.dc-group { display: flex; align-items: center; gap: 8px; }
.dc-item  { display: flex; align-items: center; gap: 5px; }
.dc-mealname { font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; color: #475569; }
.dc-input {
  width: 48px; padding: 5px 6px;
  border: 1.5px solid #e2e8f0; border-radius: 6px;
  font-size: 13px; font-weight: 700; text-align: center;
  font-family: 'Inter', sans-serif; color: #0f172a; background: #ffffff;
  outline: none; transition: border-color 0.15s;
}
.dc-input:focus { border-color: #2563eb; }
.toolbar-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 6px; font-size: 11.5px; font-weight: 600;
  font-family: 'Inter', sans-serif; cursor: pointer; border: 1px solid;
  transition: all 0.15s ease;
}
.apply-btn { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #10b981; }
.apply-btn:hover { background: rgba(16,185,129,0.22); border-color: rgba(16,185,129,0.5); transform: translateY(-1px); }

/* ── btn-warning ──────────────────────────────────────────────────────────── */
.btn-warning { background: #f59e0b; border: 1.5px solid #f59e0b; color: #ffffff; }
.btn-warning:hover { background: #d97706; border-color: #d97706; }
.btn-warning:disabled { background: #fcd34d; border-color: #fcd34d; color: #ffffff; cursor: not-allowed; }

/* ── Modal overlay ────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; backdrop-filter: blur(2px);
}
.modal {
  background: #ffffff; border-radius: 14px;
  box-shadow: 0 25px 60px rgba(15,23,42,0.25);
  width: 95vw; max-height: 92vh; overflow-y: auto;
}

/* ── Header Sticky & Theme ────────────────────────────────────────────────── */
.order-table thead tr:first-child th {
  position: sticky !important;
  top: 0 !important;
  z-index: 10 !important;
  background: #1e293b !important;
  color: #ffffff !important;
  vertical-align: middle !important;
}
.order-table thead tr.sub-header-row th {
  position: sticky !important;
  top: 36px !important;
  z-index: 9 !important;
  background: #1e293b !important;
  color: #cbd5e1 !important;
  vertical-align: middle !important;
  border-bottom: 2px solid #334155 !important;
  border-right: 1px solid #334155 !important;
  padding: 6px 8px !important;
}

/* Scoped sub-header meal colors for high visibility on dark background */
.order-table thead th.bf-color {
  color: #f97316 !important;
}
.order-table thead th.lunch-color {
  color: #34d399 !important;
}
.order-table thead th.dinner-color {
  color: #a78bfa !important;
}

/* ── Batch Cancel Buttons ─────────────────────────────────────────────────── */
.batch-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.4);
  padding: 3px 8px;
  border-radius: 6px;
}
.batch-cancel-btn {
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s ease;
  background: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  outline: none;
}
.batch-cancel-btn.bf {
  border-color: rgba(249,115,22,0.3);
  color: #c2410c;
}
.batch-cancel-btn.bf:hover {
  background: rgba(249,115,22,0.08);
}
.batch-cancel-btn.lunch {
  border-color: rgba(16,185,129,0.3);
  color: #10b981;
}
.batch-cancel-btn.lunch:hover {
  background: rgba(16,185,129,0.08);
}
.batch-cancel-btn.dinner {
  border-color: rgba(139,92,246,0.3);
  color: #6d28d9;
}
.batch-cancel-btn.dinner:hover {
  background: rgba(139,92,246,0.08);
}
.batch-cancel-btn.cancelled {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #ef4444;
}
.batch-cancel-btn.cancelled:hover {
  background: #fca5a5;
  color: #ffffff;
}
</style>
