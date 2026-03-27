// Toggle navigation menu
function toggleNavigationMenu() {
  const navigationMenu = document.getElementById('navigationPopupMenu');
  if (navigationMenu) {
    navigationMenu.style.display = navigationMenu.style.display === 'flex' ? 'none' : 'flex';
  }
}

// Helpers
function normalize(v) {
  return String(v || "").trim();
}
function normalizeForCompare(v) {
  return String(v || "").replace(/\s+/g, "").trim().toLowerCase();
}
function digitsOnly(v) {
  return String(v || "").replace(/\D/g, "");
}

// دالة لتحميل البيانات من ملف JSON
async function loadLeavesFromJSON() {
  try {
    const response = await fetch('./data.json');
    const data = await response.json();
    return data.leaves || [];
  } catch (error) {
    console.log('جاري استخدام البيانات المحلية');
    return [];
  }
}

// دالة للبحث في Google Sheets (معلقة حالياً)
async function searchInGoogleSheets(serviceCode, identityNumber) {
  return null;
}

// Initialize sample data
function initializeApplicationData() {
  if (!localStorage.getItem("seha_leaves")) {
    localStorage.setItem("seha_leaves", JSON.stringify([]));
  }
  if (!localStorage.getItem("permanent_leaves")) {
    localStorage.setItem("permanent_leaves", JSON.stringify([]));
  }
}

// Show result (محسنة للهواتف)
function showResultRecord(record) {
  const resultsDisplayBox = document.getElementById('resultsDisplayBox');
  if (resultsDisplayBox) {
    resultsDisplayBox.innerHTML = `
      <div class="information-label">الاسم</div><div class="information-data">${normalize(record.name) || "-"}</div>
      <div class="information-label">تاريخ إصدار تقرير الإجازة</div><div class="information-data">${normalize(record.issueDate || record.date) || "-"}</div>
      <div class="information-label">تبدأ من</div><div class="information-data">${normalize(record.admissionDate || record.from) || "-"}</div>
      <div class="information-label">وحتى</div><div class="information-data">${normalize(record.dischargeDate || record.to) || "-"}</div>
      <div class="information-label">المدة بالأيام</div><div class="information-data">${normalize(record.leaveDuration || record.days) || "-"}</div>
      <div class="information-label">اسم الطبيب</div><div class="information-data">${normalize(record.doctorName || record.doctor) || "-"}</div>
      <div class="information-label">المسمى الوظيفي</div><div class="information-data">${normalize(record.jobTitle || record.title) || "-"}</div>
      <div class="information-label">اسم المستشفى</div><div class="information-data">${normalize(record.hospitalName || record.hospital) || "-"}</div>
      <div class="information-label">نوع الإجازة</div><div class="information-data">${getLeaveTypeArabic(record.leaveType) || "-"}</div>
    `;
    resultsDisplayBox.style.display = 'block';
  }
}

// تحويل نوع الإجازة للعربية
function getLeaveTypeArabic(type) {
  const types = {
    'SPL': 'إجازة مرضية قصيرة',
    'GPL': 'إجازة مرضية طويلة',
    'اعتيادية': 'إجازة عادية',
    'GSL': 'إجازة مرضية قصيرة',
    'PSL': 'إجازة مرضية طويلة',
    'NSL': 'إجازة عادية'
  };
  return types[type] || type;
}

// Main Search
async function validateAndCheckData(e) {
  if (e && e.preventDefault) e.preventDefault();

  const identityNumberInput = document.getElementById('identityNumber');
  const serviceCodeInput = document.getElementById('serviceCode');
  
  if (!identityNumberInput || !serviceCodeInput) return;

  const identityNumber = normalize(identityNumberInput.value);
  const serviceCode = normalize(serviceCodeInput.value);

  const emptyFieldsErrorMessage = document.getElementById('emptyFieldsErrorMessage');
  const searchButton = document.getElementById('searchButton');
  const loadingSpinnerElement = document.getElementById('loadingSpinnerElement');
  const errorMessageTab = document.getElementById("errorMessageTab");
  const resultsDisplayBox = document.getElementById("resultsDisplayBox");

  if (!identityNumber || !serviceCode) {
    if (emptyFieldsErrorMessage) emptyFieldsErrorMessage.style.display = 'block';
    if (errorMessageTab) errorMessageTab.style.display = 'none';
    if (resultsDisplayBox) resultsDisplayBox.style.display = 'none';
    return;
  } else {
    if (emptyFieldsErrorMessage) emptyFieldsErrorMessage.style.display = 'none';
  }

  if (loadingSpinnerElement) loadingSpinnerElement.style.display = 'inline-block';
  if (searchButton) {
    searchButton.classList.add('loading');
    searchButton.disabled = true;
  }

  // البحث في البيانات من ملف JSON
  const jsonData = await loadLeavesFromJSON();
  const targetCodeDigits = digitsOnly(serviceCode);
  const targetIdDigits = digitsOnly(identityNumber);

  let found = jsonData.find(rec => {
    const recordedCodeDigits = digitsOnly(normalize(rec.leaveCode || rec.serviceCode || ""));
    const recordedIdDigits = digitsOnly(normalize(rec.nationalId || rec.idNumber || ""));
    return recordedCodeDigits === targetCodeDigits && recordedIdDigits === targetIdDigits;
  });

  // إذا لم يجد في JSON، يبحث في localStorage الدائم
  if (!found) {
    const permanentData = JSON.parse(localStorage.getItem("permanent_leaves") || "[]");
    found = permanentData.find(rec => {
      const recordedCodeDigits = digitsOnly(normalize(rec.leaveCode || rec.serviceCode || ""));
      const recordedIdDigits = digitsOnly(normalize(rec.nationalId || rec.idNumber || ""));
      return recordedCodeDigits === targetCodeDigits && recordedIdDigits === targetIdDigits;
    });
  }

  // إذا لم يجد في البيانات الدائمة، يبحث في localStorage المؤقت
  if (!found) {
    const stored = JSON.parse(localStorage.getItem("seha_leaves") || "[]");
    found = stored.find(rec => {
      const recordedCodeDigits = digitsOnly(normalize(rec.leaveCode || rec.serviceCode || ""));
      const recordedIdDigits = digitsOnly(normalize(rec.nationalId || rec.idNumber || ""));
      return recordedCodeDigits === targetCodeDigits && recordedIdDigits === targetIdDigits;
    });
  }

  if (loadingSpinnerElement) loadingSpinnerElement.style.display = 'none';
  if (searchButton) {
    searchButton.classList.remove('loading');
    searchButton.disabled = false;
  }

  if (found) {
    showResultRecord(found);
    if (errorMessageTab) errorMessageTab.style.display = 'none';
    
    const searchBtn = document.getElementById('searchButton');
    const backBtn = document.getElementById('backButton');
    const newSearchBtn = document.getElementById('newSearchButton');
    const backToListBtn = document.getElementById('backToListButton');
    
    if (searchBtn) searchBtn.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (newSearchBtn) newSearchBtn.style.display = 'block';
    if (backToListBtn) backToListBtn.style.display = 'block';
  } else {
    if (resultsDisplayBox) resultsDisplayBox.style.display = 'none';
    if (errorMessageTab) errorMessageTab.style.display = 'block';
    
    const searchBtn = document.getElementById('searchButton');
    const backBtn = document.getElementById('backButton');
    const newSearchBtn = document.getElementById('newSearchButton');
    const backToListBtn = document.getElementById('backToListButton');
    
    if (searchBtn) searchBtn.style.display = 'block';
    if (backBtn) backBtn.style.display = 'block';
    if (newSearchBtn) newSearchBtn.style.display = 'none';
    if (backToListBtn) backToListBtn.style.display = 'none';
  }
}

// Hide empty error
function hideEmptyFieldError() {
  const emptyFieldsErrorMessage = document.getElementById('emptyFieldsErrorMessage');
  if (emptyFieldsErrorMessage) {
    emptyFieldsErrorMessage.style.display = 'none';
  }
}

// Reset
function resetFormToInitialState() {
  const identityNumberInput = document.getElementById('identityNumber');
  const serviceCodeInput = document.getElementById('serviceCode');
  const errorMessageTab = document.getElementById('errorMessageTab');
  const emptyFieldsErrorMessage = document.getElementById('emptyFieldsErrorMessage');
  const resultsDisplayBox = document.getElementById('resultsDisplayBox');
  const searchButton = document.getElementById('searchButton');
  const backButton = document.getElementById('backButton');
  const newSearchButton = document.getElementById('newSearchButton');
  const backToListButton = document.getElementById('backToListButton');
  const loadingSpinnerElement = document.getElementById('loadingSpinnerElement');

  if (identityNumberInput) identityNumberInput.value = '';
  if (serviceCodeInput) serviceCodeInput.value = '';
  if (errorMessageTab) errorMessageTab.style.display = 'none';
  if (emptyFieldsErrorMessage) emptyFieldsErrorMessage.style.display = 'none';
  if (resultsDisplayBox) resultsDisplayBox.style.display = 'none';
  
  if (searchButton) {
    searchButton.style.display = 'block';
    searchButton.classList.remove('loading');
    searchButton.disabled = false;
  }
  
  if (backButton) backButton.style.display = 'block';
  if (newSearchButton) newSearchButton.style.display = 'none';
  if (backToListButton) backToListBtn.style.display = 'none';
  if (loadingSpinnerElement) loadingSpinnerElement.style.display = 'none';
}

// New search
function performNewSearch() {
  resetFormToInitialState();
}

// تحسين تجربة المستخدم على الجوال
function optimizeForMobile() {
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    });
  });
}

// إغلاق القائمة عند النقر على رابط
function closeMenuOnLinkClick() {
  const menuLinks = document.querySelectorAll('.navigation-popup-menu a, .navigation-popup-menu button');
  menuLinks.forEach(link => {
    link.addEventListener('click', function() {
      const navigationMenu = document.getElementById('navigationPopupMenu');
      if (navigationMenu) {
        navigationMenu.style.display = 'none';
      }
    });
  });
}

// دالة لتحديث data.json بالبيانات الجديدة
async function updateDataJSON(newLeave) {
  try {
    // حفظ في البيانات الدائمة
    const permanentData = JSON.parse(localStorage.getItem("permanent_leaves") || "[]");
    permanentData.push(newLeave);
    localStorage.setItem("permanent_leaves", JSON.stringify(permanentData));
    
    // عرض بيانات JSON للمستخدم للنسخ
    const jsonStr = JSON.stringify(newLeave, null, 2);
    
    // إنشاء عرض جميل للبيانات
    const leaveInfo = `
📋 **بيانات الإجازة الجديدة للنسخ:**

🔢 **رمز الإجازة:** ${newLeave.leaveCode}
👤 **اسم المريض:** ${newLeave.name}
🏥 **المستشفى:** ${newLeave.hospitalName}
📅 **تاريخ الإصدار:** ${newLeave.issueDate}
📅 **من:** ${newLeave.admissionDate}
📅 **إلى:** ${newLeave.dischargeDate}
📊 **المدة:** ${newLeave.leaveDuration} يوم
👨‍⚕️ **الطبيب:** ${newLeave.doctorName}
💼 **الوظيفة:** ${newLeave.jobTitle}
🆔 **رقم الهوية:** ${newLeave.nationalId}
📝 **نوع الإجازة:** ${newLeave.leaveType}

⚠️ **هام:** البيانات مخزنة مؤقتاً في localStorage
لجعلها دائمة، أضف السجل التالي لملف data.json:

${jsonStr}
    `;
    
    // حفظ في ملف نصي للتحميل
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave_${newLeave.leaveCode}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(leaveInfo);
    return true;
  } catch (error) {
    console.error("خطأ في تحديث JSON:", error);
    return false;
  }
}

// Init
window.addEventListener('load', () => {
  const mainHeader = document.getElementById('mainHeader');
  if (mainHeader) {
    mainHeader.classList.add('show');
  }
  
  initializeApplicationData();
  resetFormToInitialState();
  optimizeForMobile();
  closeMenuOnLinkClick();

  const searchButton = document.getElementById('searchButton');
  const serviceCodeInput = document.getElementById('serviceCode');
  const identityNumberInput = document.getElementById('identityNumber');
  const newSearchButton = document.getElementById('newSearchButton');

  if (searchButton) {
    searchButton.addEventListener('click', validateAndCheckData);
  }
  
  if (serviceCodeInput) {
    serviceCodeInput.addEventListener('input', hideEmptyFieldError);
  }
  
  if (identityNumberInput) {
    identityNumberInput.addEventListener('input', hideEmptyFieldError);
  }
  
  if (newSearchButton) {
    newSearchButton.addEventListener('click', performNewSearch);
  }
});

// دالة الدخول كمسؤول
function adminLogin() {
  const password = prompt("أدخل كلمة المرور للدخول كمسؤول:");
  const correctPassword = "12345";
  if (password === correctPassword) {
    window.location.href = "admin_inquiry.html";
  } else if (password !== null) {
    alert("كلمة المرور غير صحيحة ❌");
  }
}