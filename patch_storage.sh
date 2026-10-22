#!/bin/bash
cat << 'INNER_EOF' > /tmp/nav-patch.js
const fs = require('fs');
let code = fs.readFileSync('contexts/NavigationContext.tsx', 'utf8');

// Use localStorage to persist bookingDetails across reloads (like Auth page redirect loop clears react state)
code = code.replace(
  'const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);',
  `const [bookingDetails, _setBookingDetails] = useState<BookingDetails | null>(() => {
    if (typeof window !== "undefined") {
       const saved = localStorage.getItem('easytravel_booking_details');
       if (saved) {
          try { return JSON.parse(saved); } catch(e) {}
       }
    }
    return null;
  });

  const setBookingDetails = useCallback((details: BookingDetails | null) => {
    _setBookingDetails(details);
    if (typeof window !== "undefined") {
       if (details) {
         localStorage.setItem('easytravel_booking_details', JSON.stringify(details));
       } else {
         localStorage.removeItem('easytravel_booking_details');
       }
    }
  }, []);

  const [searchParams, _setSearchParams] = useState<SearchParams | null>(() => {
    if (typeof window !== "undefined") {
       const saved = localStorage.getItem('easytravel_search_params');
       if (saved) {
          try { return JSON.parse(saved); } catch(e) {}
       }
    }
    return null;
  });

  const setSearchParams = useCallback((params: SearchParams | null) => {
    _setSearchParams(params);
    if (typeof window !== "undefined") {
       if (params) {
         localStorage.setItem('easytravel_search_params', JSON.stringify(params));
       } else {
         localStorage.removeItem('easytravel_search_params');
       }
    }
  }, []);`
);

// We need to change original setSearchParams definition if it exists
code = code.replace('const [searchParams, setSearchParams] = useState<SearchParams | null>(null);', '');

fs.writeFileSync('contexts/NavigationContext.tsx', code);
INNER_EOF
node /tmp/nav-patch.js
