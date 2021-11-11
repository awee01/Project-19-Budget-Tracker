// create variable to hold db connection
let db;

// establish a connection to IndexedDB database called 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon success
request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
      uploadTransaction();
    }
  };

  //log error
  request.onerror = function(event) {
    console.log(event.target.errorCode);
  };

  
// Execute if attempt for new transaction without internet connection
function saveRecord(record) {
  
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    budgetObjectStore.add(record);
};

// function for collecting transaction data and to upload to cache
function uploadTransaction() {
   
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    const getAll = budgetObjectStore.getAll();
  
    // success
    getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          const budgetObjectStore = transaction.objectStore('new_transaction');
          budgetObjectStore.clear();

        })
        .catch(err => {
          console.log(err);
        });
    }
  }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);