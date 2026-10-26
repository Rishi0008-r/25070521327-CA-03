// Comprehensive Pan-India & Maharashtra-Heavy Railway Stations Dataset
// Categorized by Region, Covering ALL 18 Indian Railway Zonal Divisions with exact GPS coordinates.

const STATIONS_BY_REGION = {
  // =========================================================================
  // 1. MAHARASHTRA DENSE TRUNK NETWORK & HUBS (Central, Western & Konkan Railways)
  // =========================================================================
  MAHARASHTRA: [
    { code: 'CSMT', name: 'Chhatrapati Shivaji Maharaj Terminus', city: 'Mumbai', state: 'Maharashtra', lat: 18.9400, lng: 72.8353, zone: 'CR', platforms: 18, category: 'A1', isHub: true },
    { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', lat: 18.9696, lng: 72.8193, zone: 'WR', platforms: 5, category: 'A1', isHub: true },
    { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', state: 'Maharashtra', lat: 19.0699, lng: 72.8913, zone: 'CR', platforms: 5, category: 'A1', isHub: true },
    { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra', lat: 19.0620, lng: 72.8406, zone: 'WR', platforms: 7, category: 'A1', isHub: true },
    { code: 'DR', name: 'Dadar Central', city: 'Mumbai', state: 'Maharashtra', lat: 19.0178, lng: 72.8478, zone: 'CR', platforms: 8, category: 'A1', isHub: true },
    { code: 'TNA', name: 'Thane', city: 'Thane', state: 'Maharashtra', lat: 19.1860, lng: 72.9759, zone: 'CR', platforms: 10, category: 'A1', isHub: true },
    { code: 'KYN', name: 'Kalyan Junction', city: 'Kalyan', state: 'Maharashtra', lat: 19.2364, lng: 73.1306, zone: 'CR', platforms: 8, category: 'A1', isHub: true },
    { code: 'PNVL', name: 'Panvel Junction', city: 'Navi Mumbai', state: 'Maharashtra', lat: 18.9894, lng: 73.1175, zone: 'CR', platforms: 7, category: 'A1', isHub: true },
    { code: 'BSR', name: 'Vasai Road', city: 'Palghar', state: 'Maharashtra', lat: 19.3792, lng: 72.8397, zone: 'WR', platforms: 7, category: 'A', isHub: false },
    { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra', lat: 18.5284, lng: 73.8739, zone: 'CR', platforms: 6, category: 'A1', isHub: true },
    { code: 'DD', name: 'Daund Junction', city: 'Daund', state: 'Maharashtra', lat: 18.4639, lng: 74.5828, zone: 'CR', platforms: 6, category: 'A', isHub: true },
    { code: 'SUR', name: 'Solapur Junction', city: 'Solapur', state: 'Maharashtra', lat: 17.6599, lng: 75.9064, zone: 'CR', platforms: 5, category: 'A', isHub: true },
    { code: 'MRJ', name: 'Miraj Junction', city: 'Miraj', state: 'Maharashtra', lat: 16.8273, lng: 74.6468, zone: 'CR', platforms: 6, category: 'A', isHub: true },
    { code: 'KOP', name: 'Chhatrapati Shahu Maharaj Terminus (Kolhapur)', city: 'Kolhapur', state: 'Maharashtra', lat: 16.7050, lng: 74.2433, zone: 'CR', platforms: 3, category: 'A', isHub: false },
    { code: 'BSL', name: 'Bhusaval Junction', city: 'Bhusawal', state: 'Maharashtra', lat: 21.0478, lng: 75.7894, zone: 'CR', platforms: 8, category: 'A1', isHub: true },
    { code: 'JL', name: 'Jalgaon Junction', city: 'Jalgaon', state: 'Maharashtra', lat: 21.0077, lng: 75.5626, zone: 'CR', platforms: 5, category: 'A', isHub: false },
    { code: 'CSN', name: 'Chalisgaon Junction', city: 'Chalisgaon', state: 'Maharashtra', lat: 20.4634, lng: 74.9984, zone: 'CR', platforms: 4, category: 'B', isHub: false },
    { code: 'MMR', name: 'Manmad Junction', city: 'Manmad', state: 'Maharashtra', lat: 20.2543, lng: 74.4377, zone: 'CR', platforms: 6, category: 'A1', isHub: true },
    { code: 'NK', name: 'Nashik Road', city: 'Nashik', state: 'Maharashtra', lat: 19.9575, lng: 73.8340, zone: 'CR', platforms: 4, category: 'A', isHub: true },
    { code: 'IGP', name: 'Igatpuri', city: 'Igatpuri', state: 'Maharashtra', lat: 19.6967, lng: 73.5606, zone: 'CR', platforms: 4, category: 'B', isHub: false },
    { code: 'NGP', name: 'Nagpur Junction', city: 'Nagpur', state: 'Maharashtra', lat: 21.1524, lng: 79.0888, zone: 'CR', platforms: 8, category: 'A1', isHub: true },
    { code: 'WR', name: 'Wardha Junction', city: 'Wardha', state: 'Maharashtra', lat: 20.7453, lng: 78.5975, zone: 'CR', platforms: 4, category: 'A', isHub: true },
    { code: 'BD', name: 'Badnera Junction (Amravati)', city: 'Amravati', state: 'Maharashtra', lat: 20.8654, lng: 77.7297, zone: 'CR', platforms: 4, category: 'A', isHub: true },
    { code: 'AK', name: 'Akola Junction', city: 'Akola', state: 'Maharashtra', lat: 20.7002, lng: 77.0082, zone: 'CR', platforms: 6, category: 'A', isHub: true },
    { code: 'SEG', name: 'Shegaon', city: 'Shegaon', state: 'Maharashtra', lat: 20.7936, lng: 76.6944, zone: 'CR', platforms: 3, category: 'B', isHub: false },
    { code: 'G', name: 'Gondia Junction', city: 'Gondia', state: 'Maharashtra', lat: 21.4602, lng: 80.1961, zone: 'SECR', platforms: 7, category: 'A', isHub: true },
    { code: 'AWB', name: 'Chhatrapati Sambhajinagar (Aurangabad)', city: 'Chhatrapati Sambhajinagar', state: 'Maharashtra', lat: 19.8606, lng: 75.3189, zone: 'SCR', platforms: 5, category: 'A', isHub: true },
    { code: 'NED', name: 'Hazur Sahib Nanded', city: 'Nanded', state: 'Maharashtra', lat: 19.1663, lng: 77.3150, zone: 'SCR', platforms: 4, category: 'A', isHub: true },
    { code: 'RN', name: 'Ratnagiri', city: 'Ratnagiri', state: 'Maharashtra', lat: 16.9902, lng: 73.3120, zone: 'KR', platforms: 3, category: 'A', isHub: true },
    { code: 'SWV', name: 'Sawantwadi Road', city: 'Sawantwadi', state: 'Maharashtra', lat: 15.9080, lng: 73.8180, zone: 'KR', platforms: 2, category: 'B', isHub: false },
    { code: 'ANG', name: 'Ahmednagar', city: 'Ahmednagar', state: 'Maharashtra', lat: 19.0948, lng: 74.7480, zone: 'CR', platforms: 3, category: 'B', isHub: false },
    { code: 'KPG', name: 'Kopargaon (Shirdi Transit)', city: 'Kopargaon', state: 'Maharashtra', lat: 19.8824, lng: 74.4754, zone: 'CR', platforms: 2, category: 'A', isHub: false },
  ],

  // =========================================================================
  // 2. NORTH REGION (Northern Railway, North Central, North Eastern)
  // =========================================================================
  NORTH: [
    { code: 'NDLS', name: 'New Delhi', city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090, zone: 'NR', platforms: 16, category: 'A1', isHub: true },
    { code: 'DLI', name: 'Old Delhi Junction', city: 'Delhi', state: 'Delhi', lat: 28.6619, lng: 77.2284, zone: 'NR', platforms: 16, category: 'A1', isHub: true },
    { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi', state: 'Delhi', lat: 28.5888, lng: 77.2536, zone: 'NR', platforms: 9, category: 'A1', isHub: true },
    { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi', lat: 28.6508, lng: 77.3153, zone: 'NR', platforms: 7, category: 'A1', isHub: true },
    { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab', lat: 31.6340, lng: 74.8723, zone: 'NR', platforms: 8, category: 'A1', isHub: true },
    { code: 'CDG', name: 'Chandigarh Junction', city: 'Chandigarh', state: 'Chandigarh', lat: 30.7016, lng: 76.8210, zone: 'NR', platforms: 6, category: 'A1', isHub: true },
    { code: 'UMB', name: 'Ambala Cantt Junction', city: 'Ambala', state: 'Haryana', lat: 30.3340, lng: 76.8390, zone: 'NR', platforms: 8, category: 'A1', isHub: true },
    { code: 'LDH', name: 'Ludhiana Junction', city: 'Ludhiana', state: 'Punjab', lat: 30.9010, lng: 75.8573, zone: 'NR', platforms: 7, category: 'A1', isHub: true },
    { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu & Kashmir', lat: 32.7063, lng: 74.8800, zone: 'NR', platforms: 7, category: 'A1', isHub: true },
    { code: 'SVDK', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu & Kashmir', lat: 32.9912, lng: 74.9317, zone: 'NR', platforms: 5, category: 'A1', isHub: true },
    { code: 'HW', name: 'Haridwar Junction', city: 'Haridwar', state: 'Uttarakhand', lat: 29.9457, lng: 78.1642, zone: 'NR', platforms: 9, category: 'A1', isHub: true },
    { code: 'DDN', name: 'Dehradun Terminal', city: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, zone: 'NR', platforms: 5, category: 'A', isHub: false },
    { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8322, lng: 80.9234, zone: 'NR', platforms: 9, category: 'A1', isHub: true },
    { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4539, lng: 80.3514, zone: 'NCR', platforms: 10, category: 'A1', isHub: true },
    { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh', lat: 25.4484, lng: 81.8340, zone: 'NCR', platforms: 10, category: 'A1', isHub: true },
    { code: 'AGC', name: 'Agra Cantt', city: 'Agra', state: 'Uttar Pradesh', lat: 27.1593, lng: 78.0063, zone: 'NCR', platforms: 6, category: 'A1', isHub: true },
    { code: 'MTJ', name: 'Mathura Junction', city: 'Mathura', state: 'Uttar Pradesh', lat: 27.4924, lng: 77.6737, zone: 'NCR', platforms: 9, category: 'A1', isHub: true },
    { code: 'GWL', name: 'Gwalior Junction', city: 'Gwalior', state: 'Madhya Pradesh', lat: 26.2183, lng: 78.1828, zone: 'NCR', platforms: 5, category: 'A1', isHub: true },
    { code: 'VGLJ', name: 'Virangana Lakshmibai Jhansi', city: 'Jhansi', state: 'Uttar Pradesh', lat: 25.4484, lng: 78.5685, zone: 'NCR', platforms: 8, category: 'A1', isHub: true },
    { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3283, lng: 82.9863, zone: 'NER', platforms: 9, category: 'A1', isHub: true },
    { code: 'GKP', name: 'Gorakhpur Junction', city: 'Gorakhpur', state: 'Uttar Pradesh', lat: 26.7606, lng: 83.3732, zone: 'NER', platforms: 10, category: 'A1', isHub: true },
    { code: 'AY', name: 'Ayodhya Dham Junction', city: 'Ayodhya', state: 'Uttar Pradesh', lat: 26.7922, lng: 82.1998, zone: 'NR', platforms: 6, category: 'A1', isHub: true },
    { code: 'MB', name: 'Moradabad Junction', city: 'Moradabad', state: 'Uttar Pradesh', lat: 28.8386, lng: 78.7733, zone: 'NR', platforms: 7, category: 'A', isHub: true },
    { code: 'BE', name: 'Bareilly Junction', city: 'Bareilly', state: 'Uttar Pradesh', lat: 28.3470, lng: 79.4304, zone: 'NR', platforms: 6, category: 'A', isHub: true },
  ],

  // =========================================================================
  // 3. SOUTH REGION (Southern Railway, South Western, South Central)
  // =========================================================================
  SOUTH: [
    { code: 'MAS', name: 'MGR Chennai Central', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, zone: 'SR', platforms: 17, category: 'A1', isHub: true },
    { code: 'MS', name: 'Chennai Egmore', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0784, lng: 80.2612, zone: 'SR', platforms: 11, category: 'A1', isHub: true },
    { code: 'KPD', name: 'Katpadi Junction', city: 'Vellore', state: 'Tamil Nadu', lat: 12.9698, lng: 79.1368, zone: 'SR', platforms: 5, category: 'A', isHub: true },
    { code: 'CBE', name: 'Coimbatore Junction', city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0016, lng: 76.9628, zone: 'SR', platforms: 6, category: 'A1', isHub: true },
    { code: 'MDU', name: 'Madurai Junction', city: 'Madurai', state: 'Tamil Nadu', lat: 9.9197, lng: 78.1108, zone: 'SR', platforms: 8, category: 'A1', isHub: true },
    { code: 'TPJ', name: 'Tiruchchirappalli Junction', city: 'Tiruchirappalli', state: 'Tamil Nadu', lat: 10.7946, lng: 78.6854, zone: 'SR', platforms: 8, category: 'A1', isHub: true },
    { code: 'SA', name: 'Salem Junction', city: 'Salem', state: 'Tamil Nadu', lat: 11.6643, lng: 78.1460, zone: 'SR', platforms: 6, category: 'A', isHub: true },
    { code: 'ERS', name: 'Ernakulam Junction (South)', city: 'Kochi', state: 'Kerala', lat: 9.9675, lng: 76.2938, zone: 'SR', platforms: 6, category: 'A1', isHub: true },
    { code: 'TVC', name: 'Thiruvananthapuram Central', city: 'Thiruvananthapuram', state: 'Kerala', lat: 8.4875, lng: 76.9525, zone: 'SR', platforms: 5, category: 'A1', isHub: true },
    { code: 'CLT', name: 'Kozhikode Main', city: 'Kozhikode', state: 'Kerala', lat: 11.2483, lng: 75.7839, zone: 'SR', platforms: 4, category: 'A1', isHub: true },
    { code: 'CAN', name: 'Kannur', city: 'Kannur', state: 'Kerala', lat: 11.8745, lng: 75.3704, zone: 'SR', platforms: 3, category: 'A', isHub: false },
    { code: 'TCR', name: 'Thrissur', city: 'Thrissur', state: 'Kerala', lat: 10.5186, lng: 76.2132, zone: 'SR', platforms: 4, category: 'A', isHub: false },
    { code: 'CAPE', name: 'Kanniyakumari Terminus', city: 'Kanyakumari', state: 'Tamil Nadu', lat: 8.0883, lng: 77.5385, zone: 'SR', platforms: 4, category: 'A1', isHub: true },
    { code: 'SBC', name: 'KSR Bengaluru City Junction', city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, zone: 'SWR', platforms: 10, category: 'A1', isHub: true },
    { code: 'YPR', name: 'Yesvantpur Junction', city: 'Bengaluru', state: 'Karnataka', lat: 13.0238, lng: 77.5503, zone: 'SWR', platforms: 6, category: 'A1', isHub: true },
    { code: 'MYS', name: 'Mysuru Junction', city: 'Mysuru', state: 'Karnataka', lat: 12.3168, lng: 76.6457, zone: 'SWR', platforms: 6, category: 'A1', isHub: true },
    { code: 'UBL', name: 'SSS Hubballi Junction', city: 'Hubballi', state: 'Karnataka', lat: 15.3444, lng: 75.1481, zone: 'SWR', platforms: 8, category: 'A1', isHub: true },
    { code: 'BGM', name: 'Belagavi', city: 'Belagavi', state: 'Karnataka', lat: 15.8667, lng: 74.5000, zone: 'SWR', platforms: 4, category: 'A', isHub: false },
    { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana', lat: 17.4344, lng: 78.5013, zone: 'SCR', platforms: 10, category: 'A1', isHub: true },
    { code: 'HYB', name: 'Hyderabad Deccan Nampally', city: 'Hyderabad', state: 'Telangana', lat: 17.3920, lng: 78.4718, zone: 'SCR', platforms: 6, category: 'A1', isHub: true },
    { code: 'BZA', name: 'Vijayawada Junction', city: 'Vijayawada', state: 'Andhra Pradesh', lat: 16.5173, lng: 80.6200, zone: 'SCR', platforms: 10, category: 'A1', isHub: true },
    { code: 'TPTY', name: 'Tirupati Main', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192, zone: 'SCR', platforms: 5, category: 'A1', isHub: true },
    { code: 'KZJ', name: 'Kazipet Junction', city: 'Warangal', state: 'Telangana', lat: 17.9784, lng: 79.5218, zone: 'SCR', platforms: 5, category: 'A', isHub: true },
    { code: 'GTL', name: 'Guntakal Junction', city: 'Guntakal', state: 'Andhra Pradesh', lat: 15.1672, lng: 77.3695, zone: 'SCR', platforms: 7, category: 'A', isHub: true },
    { code: 'RU', name: 'Renigunta Junction', city: 'Tirupati', state: 'Andhra Pradesh', lat: 13.6492, lng: 79.5160, zone: 'SCR', platforms: 6, category: 'A', isHub: true },
    { code: 'VSKP', name: 'Visakhapatnam Junction', city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.7214, lng: 83.2872, zone: 'ECoR', platforms: 8, category: 'A1', isHub: true },
  ],

  // =========================================================================
  // 4. EAST REGION (Eastern Railway, South Eastern, East Central, East Coast)
  // =========================================================================
  EAST: [
    { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal', lat: 22.5839, lng: 88.3426, zone: 'ER', platforms: 23, category: 'A1', isHub: true },
    { code: 'SDAH', name: 'Sealdah', city: 'Kolkata', state: 'West Bengal', lat: 22.5697, lng: 88.3697, zone: 'ER', platforms: 21, category: 'A1', isHub: true },
    { code: 'ASN', name: 'Asansol Junction', city: 'Asansol', state: 'West Bengal', lat: 23.6889, lng: 86.9661, zone: 'ER', platforms: 8, category: 'A1', isHub: true },
    { code: 'MLDT', name: 'Malda Town', city: 'Malda', state: 'West Bengal', lat: 25.0108, lng: 88.1411, zone: 'ER', platforms: 7, category: 'A', isHub: true },
    { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', state: 'West Bengal', lat: 22.3364, lng: 87.3275, zone: 'SER', platforms: 12, category: 'A1', isHub: true },
    { code: 'TATA', name: 'Tatanagar Junction', city: 'Jamshedpur', state: 'Jharkhand', lat: 22.7667, lng: 86.2000, zone: 'SER', platforms: 6, category: 'A1', isHub: true },
    { code: 'ROU', name: 'Rourkela Junction', city: 'Rourkela', state: 'Odisha', lat: 22.2272, lng: 84.8617, zone: 'SER', platforms: 5, category: 'A', isHub: true },
    { code: 'RNC', name: 'Ranchi Junction', city: 'Ranchi', state: 'Jharkhand', lat: 23.3500, lng: 85.3333, zone: 'SER', platforms: 6, category: 'A1', isHub: true },
    { code: 'DHN', name: 'Dhanbad Junction', city: 'Dhanbad', state: 'Jharkhand', lat: 23.7957, lng: 86.4304, zone: 'ECR', platforms: 8, category: 'A1', isHub: true },
    { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar', lat: 25.6025, lng: 85.1376, zone: 'ECR', platforms: 10, category: 'A1', isHub: true },
    { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', state: 'Bihar', lat: 24.7955, lng: 85.0002, zone: 'ECR', platforms: 9, category: 'A1', isHub: true },
    { code: 'MFP', name: 'Muzaffarpur Junction', city: 'Muzaffarpur', state: 'Bihar', lat: 26.1209, lng: 85.3906, zone: 'ECR', platforms: 6, category: 'A', isHub: false },
    { code: 'BGP', name: 'Bhagalpur Junction', city: 'Bhagalpur', state: 'Bihar', lat: 25.2425, lng: 87.0142, zone: 'ER', platforms: 6, category: 'A', isHub: false },
    { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Junction', city: 'Mughalsarai', state: 'Uttar Pradesh', lat: 25.2818, lng: 83.1158, zone: 'ECR', platforms: 8, category: 'A1', isHub: true },
    { code: 'CPR', name: 'Chhapra Junction', city: 'Chhapra', state: 'Bihar', lat: 25.7796, lng: 84.7499, zone: 'NER', platforms: 5, category: 'A', isHub: false },
    { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha', lat: 20.2644, lng: 85.8427, zone: 'ECoR', platforms: 6, category: 'A1', isHub: true },
    { code: 'CTC', name: 'Cuttack Junction', city: 'Cuttack', state: 'Odisha', lat: 20.4625, lng: 85.8830, zone: 'ECoR', platforms: 5, category: 'A', isHub: false },
    { code: 'PURI', name: 'Puri Terminus', city: 'Puri', state: 'Odisha', lat: 19.8135, lng: 85.8312, zone: 'ECoR', platforms: 8, category: 'A1', isHub: true },
    { code: 'DDJ', name: 'Dum Dum Junction (Kolkata Metro Interchange)', city: 'Kolkata', state: 'West Bengal', lat: 22.6223, lng: 88.3792, zone: 'MR', platforms: 5, category: 'A', isHub: false },
  ],

  // =========================================================================
  // 5. WEST REGION (Western Railway, West Central, North Western)
  // =========================================================================
  WEST: [
    { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0258, lng: 72.6011, zone: 'WR', platforms: 12, category: 'A1', isHub: true },
    { code: 'ST', name: 'Surat', city: 'Surat', state: 'Gujarat', lat: 21.2049, lng: 72.8406, zone: 'WR', platforms: 4, category: 'A1', isHub: true },
    { code: 'BRC', name: 'Vadodara Junction', city: 'Vadodara', state: 'Gujarat', lat: 22.3106, lng: 73.1812, zone: 'WR', platforms: 7, category: 'A1', isHub: true },
    { code: 'RTM', name: 'Ratlam Junction', city: 'Ratlam', state: 'Madhya Pradesh', lat: 23.3441, lng: 75.0400, zone: 'WR', platforms: 7, category: 'A1', isHub: true },
    { code: 'RJT', name: 'Rajkot Junction', city: 'Rajkot', state: 'Gujarat', lat: 22.3100, lng: 70.8000, zone: 'WR', platforms: 5, category: 'A', isHub: false },
    { code: 'BH', name: 'Bharuch Junction', city: 'Bharuch', state: 'Gujarat', lat: 21.7118, lng: 72.9997, zone: 'WR', platforms: 4, category: 'A', isHub: false },
    { code: 'ANND', name: 'Anand Junction', city: 'Anand', state: 'Gujarat', lat: 22.5645, lng: 72.9289, zone: 'WR', platforms: 5, category: 'A', isHub: false },
    { code: 'BVC', name: 'Bhavnagar Terminus', city: 'Bhavnagar', state: 'Gujarat', lat: 21.7645, lng: 72.1519, zone: 'WR', platforms: 4, category: 'A', isHub: false },
    { code: 'INDB', name: 'Indore Junction', city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, zone: 'WR', platforms: 6, category: 'A1', isHub: true },
    { code: 'UJN', name: 'Ujjain Junction', city: 'Ujjain', state: 'Madhya Pradesh', lat: 23.1765, lng: 75.7885, zone: 'WR', platforms: 8, category: 'A1', isHub: true },
    { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan', lat: 26.9196, lng: 75.7878, zone: 'NWR', platforms: 8, category: 'A1', isHub: true },
    { code: 'JU', name: 'Jodhpur Junction', city: 'Jodhpur', state: 'Rajasthan', lat: 26.2808, lng: 73.0189, zone: 'NWR', platforms: 5, category: 'A1', isHub: true },
    { code: 'AII', name: 'Ajmer Junction', city: 'Ajmer', state: 'Rajasthan', lat: 26.4525, lng: 74.6399, zone: 'NWR', platforms: 5, category: 'A', isHub: true },
    { code: 'UDZ', name: 'Udaipur City', city: 'Udaipur', state: 'Rajasthan', lat: 24.5713, lng: 73.6981, zone: 'NWR', platforms: 5, category: 'A', isHub: false },
    { code: 'BKN', name: 'Bikaner Junction', city: 'Bikaner', state: 'Rajasthan', lat: 28.0167, lng: 73.3119, zone: 'NWR', platforms: 6, category: 'A', isHub: false },
    { code: 'KOTA', name: 'Kota Junction', city: 'Kota', state: 'Rajasthan', lat: 25.2138, lng: 75.8648, zone: 'WCR', platforms: 5, category: 'A1', isHub: true },
  ],

  // =========================================================================
  // 6. CENTRAL & CORRIDOR JUNCTIONS (West Central, South East Central, Central)
  // =========================================================================
  CENTRAL: [
    { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, zone: 'WCR', platforms: 6, category: 'A1', isHub: true },
    { code: 'RKMP', name: 'Rani Kamlapati (Habibganj)', city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2081, lng: 77.4360, zone: 'WCR', platforms: 5, category: 'A1', isHub: true },
    { code: 'ET', name: 'Itarsi Junction', city: 'Itarsi', state: 'Madhya Pradesh', lat: 22.6143, lng: 77.7618, zone: 'WCR', platforms: 8, category: 'A1', isHub: true },
    { code: 'JBP', name: 'Jabalpur Junction', city: 'Jabalpur', state: 'Madhya Pradesh', lat: 23.1686, lng: 79.9436, zone: 'WCR', platforms: 6, category: 'A1', isHub: true },
    { code: 'BSP', name: 'Bilaspur Junction', city: 'Bilaspur', state: 'Chhattisgarh', lat: 22.0797, lng: 82.1409, zone: 'SECR', platforms: 8, category: 'A1', isHub: true },
    { code: 'R', name: 'Raipur Junction', city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, zone: 'SECR', platforms: 7, category: 'A1', isHub: true },
    { code: 'DURG', name: 'Durg Junction', city: 'Durg', state: 'Chhattisgarh', lat: 21.1904, lng: 81.2849, zone: 'SECR', platforms: 6, category: 'A', isHub: true },
    { code: 'MAO', name: 'Madgaon Junction', city: 'Madgaon', state: 'Goa', lat: 15.2741, lng: 73.9582, zone: 'KR', platforms: 4, category: 'A1', isHub: true },
    { code: 'UD', name: 'Udupi', city: 'Udupi', state: 'Karnataka', lat: 13.3409, lng: 74.7421, zone: 'KR', platforms: 2, category: 'A', isHub: false },
    { code: 'KAWR', name: 'Karwar', city: 'Karwar', state: 'Karnataka', lat: 14.8239, lng: 74.1507, zone: 'KR', platforms: 2, category: 'B', isHub: false },
    { code: 'MAJN', name: 'Mangaluru Junction', city: 'Mangaluru', state: 'Karnataka', lat: 12.8687, lng: 74.8703, zone: 'SR', platforms: 3, category: 'A', isHub: true },
  ],

  // =========================================================================
  // 7. NORTHEAST REGION (Northeast Frontier Railway)
  // =========================================================================
  NORTHEAST: [
    { code: 'GHY', name: 'Guwahati', city: 'Guwahati', state: 'Assam', lat: 26.1834, lng: 91.7506, zone: 'NFR', platforms: 7, category: 'A1', isHub: true },
    { code: 'KYQ', name: 'Kamakhya Junction', city: 'Guwahati', state: 'Assam', lat: 26.1558, lng: 91.7058, zone: 'NFR', platforms: 4, category: 'A', isHub: false },
    { code: 'NJP', name: 'New Jalpaiguri Junction', city: 'Siliguri', state: 'West Bengal', lat: 26.6853, lng: 88.4418, zone: 'NFR', platforms: 8, category: 'A1', isHub: true },
    { code: 'DBRG', name: 'Dibrugarh', city: 'Dibrugarh', state: 'Assam', lat: 27.4728, lng: 94.9120, zone: 'NFR', platforms: 4, category: 'A', isHub: true },
    { code: 'AGTL', name: 'Agartala', city: 'Agartala', state: 'Tripura', lat: 23.8315, lng: 91.2868, zone: 'NFR', platforms: 3, category: 'A', isHub: true },
    { code: 'SCL', name: 'Silchar', city: 'Silchar', state: 'Assam', lat: 24.8333, lng: 92.7789, zone: 'NFR', platforms: 3, category: 'B', isHub: false },
    { code: 'DMV', name: 'Dimapur', city: 'Dimapur', state: 'Nagaland', lat: 25.9060, lng: 93.7270, zone: 'NFR', platforms: 2, category: 'A', isHub: false },
    { code: 'APDJ', name: 'Alipurduar Junction', city: 'Alipurduar', state: 'West Bengal', lat: 26.5160, lng: 89.5330, zone: 'NFR', platforms: 4, category: 'B', isHub: false },
    { code: 'RNY', name: 'Rangiya Junction', city: 'Rangiya', state: 'Assam', lat: 26.4380, lng: 91.6280, zone: 'NFR', platforms: 5, category: 'B', isHub: false },
    { code: 'KIR', name: 'Katihar Junction', city: 'Katihar', state: 'Bihar', lat: 25.5410, lng: 87.5720, zone: 'NFR', platforms: 8, category: 'A', isHub: true },
  ],
};

// Flattened Pan-India station list (110+ stations covering all 18 zones)
const MAJOR_STATIONS = [
  ...STATIONS_BY_REGION.MAHARASHTRA,
  ...STATIONS_BY_REGION.NORTH,
  ...STATIONS_BY_REGION.SOUTH,
  ...STATIONS_BY_REGION.EAST,
  ...STATIONS_BY_REGION.WEST,
  ...STATIONS_BY_REGION.CENTRAL,
  ...STATIONS_BY_REGION.NORTHEAST,
];

// Deduplicate by station code if any duplicates exist
const uniqueStationMap = new Map();
MAJOR_STATIONS.forEach((stn) => {
  if (!uniqueStationMap.has(stn.code)) {
    uniqueStationMap.set(stn.code, stn);
  }
});

const DEDUPED_MAJOR_STATIONS = Array.from(uniqueStationMap.values());

export const STATIONS = DEDUPED_MAJOR_STATIONS;
export { STATIONS_BY_REGION, DEDUPED_MAJOR_STATIONS as MAJOR_STATIONS };
export default DEDUPED_MAJOR_STATIONS;
