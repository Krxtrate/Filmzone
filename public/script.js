document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let currentUser = null;
    let allMovies = [];
    let selectedSeatsCount = 0;
    const TICKET_PRICE = 200; // ₹200 per seat

    // --- Elements ---
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const welcomeText = document.getElementById('welcome-text');
    const cardsContainer = document.getElementById('cards-container');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const categoryBtns = document.querySelectorAll('.category');
    
    // Sections
    const sections = {
        'dashboard-hero': document.getElementById('dashboard-hero'),
        'dashboard-featured': document.getElementById('dashboard-featured'),
        'about-section': document.getElementById('about-section'),
        'bookings-section': document.getElementById('bookings-section')
    };
    
    // Modals
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const bookingModal = document.getElementById('booking-modal');
    
    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const bookingForm = document.getElementById('booking-form');

    // Seat Elements
    const seatGrid = document.getElementById('seat-grid');
    const bookTotal = document.getElementById('book-total');
    const bookSelectedSeats = document.getElementById('book-selected-seats');
    const confirmBookingBtn = document.getElementById('confirm-booking-btn');

    // --- Initialization ---
    checkLoginState();
    fetchMovies();

    // --- Navigation ---
    document.querySelectorAll('#main-nav a').forEach(navLink => {
        navLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#main-nav a').forEach(l => l.classList.remove('active'));
            navLink.classList.add('active');
            
            const target = navLink.dataset.target;
            
            // Hide all
            Object.values(sections).forEach(sec => sec.classList.add('hidden'));
            
            if (target === 'dashboard-hero') {
                sections['dashboard-hero'].classList.remove('hidden');
                sections['dashboard-featured'].classList.remove('hidden');
                document.querySelector('.section-header h2').textContent = 'Now Showing';
                renderMovies(allMovies.slice(0, 4)); // Show first 4 on home
            } else if (target === 'dashboard-featured') {
                sections['dashboard-featured'].classList.remove('hidden');
                document.querySelector('.section-header h2').textContent = 'Full Movie Catalog';
                renderMovies(allMovies); // Show all
            } else if (target === 'bookings-section') {
                sections['bookings-section'].classList.remove('hidden');
                fetchMyBookings();
            } else if (target === 'about-section') {
                sections['about-section'].classList.remove('hidden');
            }
        });
    });

    // --- Fetch Movies ---
    function fetchMovies(query = '') {
        let url = 'http://localhost:3000/api/movies';
        if (query) url += `?search=${encodeURIComponent(query)}`;

        fetch(url)
            .then(res => res.json())
            .then(movies => {
                allMovies = movies;
                // Default view is Home (showing a slice, or just all if few)
                renderMovies(movies);
            })
            .catch(err => showToast('Error fetching movies', true));
    }

    // --- Render Movies ---
    function renderMovies(movies) {
        cardsContainer.innerHTML = '';
        if (movies.length === 0) {
            cardsContainer.innerHTML = '<p>No movies found.</p>';
            return;
        }

        movies.forEach((movie) => {
            const dateObj = new Date(movie.show_date);
            const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
            const timeStr = movie.show_time ? movie.show_time.substring(0, 5) : '';
            
            // Use local image based on title. If it fails, fallback.
            const imagePath = `images/${movie.title.replace(/ /g, '_')}.jpg`;

            const card = document.createElement('div');
            card.className = 'card fade-in';
            card.innerHTML = `
                <div class="card-image" style="background-image: linear-gradient(to top, #15161c, transparent), url('${imagePath}');"></div>
                <div class="card-content">
                    <div class="card-tag">${movie.genre.toUpperCase()}</div>
                    <h3>${movie.title}</h3>
                    <p class="card-info">📅 ${dateStr} at ${timeStr}</p>
                    <p class="card-info">📍 ${movie.theatre_name}</p>
                    <div class="card-footer">
                        <span class="price">₹${TICKET_PRICE}</span>
                        <button class="view-btn book-now-btn" data-id="${movie.show_id}">Book Now →</button>
                    </div>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        document.querySelectorAll('.book-now-btn').forEach(btn => {
            btn.addEventListener('click', (e) => openBookingModal(e.target.dataset.id));
        });
    }

    // --- Search & Filter ---
    searchBtn.addEventListener('click', () => fetchMovies(searchInput.value));
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') fetchMovies(searchInput.value);
    });

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const genre = btn.dataset.genre;
            if (!genre) renderMovies(allMovies);
            else renderMovies(allMovies.filter(m => m.genre === genre));
            
            // Force scroll to catalog view
            Object.values(sections).forEach(sec => sec.classList.add('hidden'));
            sections['dashboard-featured'].classList.remove('hidden');
        });
    });

    // --- Modal Logic ---
    function setupModal(btnId, modalElement) {
        if(document.getElementById(btnId)) {
            document.getElementById(btnId).addEventListener('click', (e) => {
                e.preventDefault();
                modalElement.classList.remove('hidden');
            });
        }
    }
    setupModal('login-btn', loginModal);
    setupModal('register-btn', registerModal);

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) e.target.classList.add('hidden');
    });

    // --- Authentication ---
    function checkLoginState() {
        const user = localStorage.getItem('filmzone_user');
        if (user) {
            currentUser = JSON.parse(user);
            authButtons.classList.add('hidden');
            userProfile.classList.remove('hidden');
            welcomeText.textContent = `Welcome, ${currentUser.name}`;
            document.getElementById('nav-bookings').classList.remove('hidden');
        } else {
            currentUser = null;
            authButtons.classList.remove('hidden');
            userProfile.classList.add('hidden');
            document.getElementById('nav-bookings').classList.add('hidden');
        }
    }

    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('filmzone_user');
        checkLoginState();
        showToast('Logged out successfully');
        // Redirect to home
        document.querySelector('#main-nav a[data-target="dashboard-hero"]').click();
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            phone: document.getElementById('register-phone').value,
            password: document.getElementById('register-password').value
        };

        fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) showToast(data.error, true);
            else {
                showToast('Registration successful! Please login.');
                registerModal.classList.add('hidden');
                registerForm.reset();
                loginModal.classList.remove('hidden');
            }
        });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        };

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) showToast(data.error, true);
            else {
                localStorage.setItem('filmzone_user', JSON.stringify(data.user));
                checkLoginState();
                loginModal.classList.add('hidden');
                loginForm.reset();
                showToast('Login successful!');
            }
        });
    });

    // --- Booking Logic ---
    function generateSeats() {
        seatGrid.innerHTML = '';
        selectedSeatsCount = 0;
        updateBookingTotal();
        
        // 40 seats
        for (let i = 0; i < 40; i++) {
            const seat = document.createElement('div');
            seat.className = 'seat';
            
            // Randomly mark 30% as occupied
            if (Math.random() < 0.3) {
                seat.classList.add('occupied');
            } else {
                seat.addEventListener('click', () => {
                    seat.classList.toggle('selected');
                    
                    if (seat.classList.contains('selected')) {
                        selectedSeatsCount++;
                    } else {
                        selectedSeatsCount--;
                    }
                    updateBookingTotal();
                });
            }
            seatGrid.appendChild(seat);
        }
    }

    function updateBookingTotal() {
        const total = selectedSeatsCount * TICKET_PRICE;
        bookTotal.textContent = total;
        bookSelectedSeats.value = selectedSeatsCount;
        
        if (selectedSeatsCount > 0) {
            confirmBookingBtn.removeAttribute('disabled');
            confirmBookingBtn.textContent = `Confirm Booking (₹${total})`;
        } else {
            confirmBookingBtn.setAttribute('disabled', 'true');
            confirmBookingBtn.textContent = 'Select Seats to Book';
        }
    }

    function openBookingModal(showId) {
        if (!currentUser) {
            showToast('Please login to book tickets', true);
            loginModal.classList.remove('hidden');
            return;
        }

        const movie = allMovies.find(m => m.show_id == showId);
        if (!movie) return;

        document.getElementById('book-title').textContent = movie.title;
        document.getElementById('book-info').textContent = `${movie.theatre_name} | ${new Date(movie.show_date).toLocaleDateString()} ${movie.show_time.substring(0,5)}`;
        document.getElementById('book-show-id').value = showId;
        
        generateSeats();
        bookingModal.classList.remove('hidden');
    }

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const showId = document.getElementById('book-show-id').value;
        const totalAmount = selectedSeatsCount * TICKET_PRICE;

        if (selectedSeatsCount === 0) return;

        fetch('http://localhost:3000/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.user_id,
                showId: showId,
                totalAmount: totalAmount
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) showToast(data.error, true);
            else {
                showToast(`Successfully booked ${selectedSeatsCount} tickets for ₹${totalAmount}!`);
                bookingModal.classList.add('hidden');
                
                // If on bookings tab, refresh it
                if (!document.getElementById('bookings-section').classList.contains('hidden')) {
                    fetchMyBookings();
                }
            }
        });
    });

    // --- My Bookings ---
    function fetchMyBookings() {
        const bookingsList = document.getElementById('bookings-list');
        bookingsList.innerHTML = '<p>Loading your bookings...</p>';

        fetch(`http://localhost:3000/api/bookings/${currentUser.user_id}`)
            .then(res => res.json())
            .then(bookings => {
                bookingsList.innerHTML = '';
                
                if (bookings.error) {
                    bookingsList.innerHTML = `<p>Error: ${bookings.error}</p>`;
                    return;
                }

                if (!bookings || bookings.length === 0) {
                    bookingsList.innerHTML = '<p>You have no bookings yet.</p>';
                    return;
                }

                bookings.forEach(b => {
                    const dateStr = new Date(b.show_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                    const timeStr = b.show_time ? b.show_time.substring(0, 5) : '';

                    const item = document.createElement('div');
                    item.className = 'booking-item fade-in';
                    item.innerHTML = `
                        <div class="booking-item-info">
                            <span class="card-tag" style="margin-bottom: 5px;">Order #${b.booking_id}</span>
                            <h3>${b.title}</h3>
                            <p>📅 ${dateStr} at ${timeStr}</p>
                            <p>📍 ${b.theatre_name}</p>
                            <p style="font-size: 12px; margin-top: 5px;">Booked on: ${new Date(b.booking_date).toLocaleDateString()}</p>
                        </div>
                        <div class="booking-item-price">
                            ₹${b.total_amount}
                        </div>
                    `;
                    bookingsList.appendChild(item);
                });
            })
            .catch(err => {
                console.error("Fetch Bookings Error:", err);
                bookingsList.innerHTML = `<p>Error loading bookings: ${err.message}. Check browser console.</p>`;
            });
    }

    // --- Toast UI ---
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.background = isError ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)' : 'linear-gradient(135deg, #ff5722 0%, #ff9800 100%)';
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
});
