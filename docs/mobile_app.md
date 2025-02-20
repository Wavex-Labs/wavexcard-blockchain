import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';

const { width } = Dimensions.get('window');

// Data
const featuredPasses = [
  {
    id: 1,
    name: 'WaveX Black Card',
    type: 'Premium Membership',
    price: '1000 USDT',
    supply: '100/1000',  image: 'https://api.a0.dev/assets/image?text=futuristic cyberpunk black credit card with neon accents and holographic details, minimalist wavex logo in bottom right corner&aspect=16:9',
    benefits: [
      'Priority Entry to All Events',
      'Dedicated Concierge Service',
      '30% Off at Partner Venues',
      'Exclusive VIP Areas',
      'Free Drinks at Select Venues'
    ],
    merchantCount: 150,
    description: 'The ultimate luxury membership card giving you VIP access to exclusive events and premium benefits across our partner network.',
  },
  {
    id: 2,
    name: 'WaveX Gold Card',
    type: 'VIP Membership',
    price: '500 USDT',
    supply: '500/2000',  image: 'https://api.a0.dev/assets/image?text=futuristic cyberpunk gold credit card with neon accents and holographic details, minimalist wavex logo in bottom right corner&aspect=16:9',
    benefits: [
      'VIP Entry to Events',
      '20% Off at Partners',
      'Priority Event Access',
      'Member-Only Events'
    ],
    merchantCount: 100,
    description: 'A premium membership card offering VIP benefits and exclusive access to selected events and venues.',
  },
  {
    id: 3,
    name: 'WaveX Platinum Card',
    type: 'Elite Membership',
    price: '2000 USDT',
    supply: '50/500',  image: 'https://api.a0.dev/assets/image?text=futuristic cyberpunk platinum credit card with neon accents and holographic details, minimalist wavex logo in bottom right corner&aspect=16:9',
    benefits: [
      'VIP Access to All Events',
      'Personal Concierge 24/7',
      '50% Off at Partner Venues',
      'Private Event Access',
      'Unlimited Guest Passes',
      'Priority Booking for Events',
      'Complimentary Champagne'
    ],
    merchantCount: 200,
    description: 'The elite membership card offering unparalleled access and benefits across our exclusive network of venues and events.',
  },
];

const events = [
  {
    id: 'brunch-001',
    name: 'WaveX Brunch',
    duration: '5 Hours (10 AM - 3 PM)',
    price: '392.50 USDT',
    image: 'https://api.a0.dev/assets/image?text=luxury yacht brunch with ocean view and elegant setup&aspect=16:9',
    description: 'A luxury brunch experience aboard a premium yacht with gourmet cuisine and premium entertainment.',
    highlights: [
      'Gourmet buffet',
      'Bottomless mimosas',
      'Live music',
      'Luxury networking'
    ],
    venue: 'Premium Yacht',
    remaining: '20 tickets',
    date: '2024-03-24',
    benefits: ['Express Entry', 'VIP Area Access', 'Welcome Champagne'],
  },
  {
    id: 1,
    name: 'Ultra Music Festival 2025',
    date: '2025-03-28',
    price: '150 USDT',
    image: 'https://api.a0.dev/assets/image?text=ultra music festival crowd with lasers&aspect=16:9',
    venue: 'Miami Marine Stadium',
    remaining: '1000 tickets',
    benefits: ['Express Entry', 'VIP Area Access', 'Free Welcome Drink'],
  },
  {
    id: 2,
    name: 'Summer Beach Party',
    date: '2024-07-15',
    price: '50 USDT',
    image: 'https://api.a0.dev/assets/image?text=beach party with sunset and dj booth&aspect=16:9',
    venue: 'South Beach Club',
    remaining: '500 tickets',
    benefits: ['Standard Entry', 'Beach Access', 'Party Kit'],
  },
];

const WaveXMarketplace = () => {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // UI States
  const [showBenefits, setShowBenefits] = useState({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [showAppleWalletModal, setShowAppleWalletModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  const toggleBenefits = useCallback((id) => {
    setShowBenefits(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handlePurchase = useCallback((item, method) => {
    setSelectedItem(item);
    setPaymentMethod(method);
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
    } else {
      setShowDetailModal(true);
    }
  }, [isAuthenticated]);

  const handleAuth = async (method) => {
    setLoading(true);
    try {
      // Simulate auth
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsAuthenticated(true);
      setShowAuthModal(false);
      
      if (selectedItem) {
        setShowDetailModal(true);
      }
      
      toast.success(`Successfully connected with ${method}!`);
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setProcessingPayment(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowDetailModal(false);
      setShowAppleWalletModal(true);
      toast.success('Purchase successful!');
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleAddToAppleWallet = async () => {
    setLoading(true);
    try {
      // Simulate adding to Apple Wallet
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowAppleWalletModal(false);
      toast.success('Added to Apple Wallet successfully!');
    } catch (error) {
      toast.error('Failed to add to Apple Wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderAuthModal = () => (
    <Modal
      visible={showAuthModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAuthModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Connect to Continue</Text>
          <Text style={styles.modalSubtitle}>Choose your login method</Text>

          <TouchableOpacity
            style={styles.authButton}
            onPress={() => handleAuth('magic')}
            disabled={loading}
          >
            <MaterialIcons name="email" size={24} color="#fff" />
            <Text style={styles.authButtonText}>Continue with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.walletButton]}
            onPress={() => handleAuth('wallet')}
            disabled={loading}
          >
            <FontAwesome5 name="wallet" size={24} color="#fff" />
            <Text style={styles.authButtonText}>Connect Wallet</Text>
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator style={styles.loader} size="large" color="#7C3AED" />
          )}

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowAuthModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderDetailModal = () => (
    <Modal
      visible={showDetailModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailScroll}>
            <Image 
              source={{ uri: selectedItem?.image }} 
              style={styles.detailImage}
            />

            <Text style={styles.detailPrice}>
              Price: {selectedItem?.price}
            </Text>

            <Text style={styles.detailDescription}>
              {selectedItem?.description}
            </Text>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Benefits:</Text>
              {selectedItem?.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialIcons name="check-circle" size={16} color="#22C55E" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {selectedItem?.merchantCount && (
              <Text style={styles.merchantCount}>
                {selectedItem.merchantCount}+ Authorized Merchants
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                processingPayment && styles.checkoutButtonDisabled
              ]}
              onPress={handleCheckout}
              disabled={processingPayment}
            >
              {processingPayment ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <FontAwesome5 
                    name={paymentMethod === 'fiat' ? 'credit-card' : 'wallet'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.checkoutButtonText}>
                    Confirm Purchase ({selectedItem?.price})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderAppleWalletModal = () => (
    <Modal
      visible={showAppleWalletModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAppleWalletModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={64} color="#22C55E" />
          </View>

          <Text style={styles.successTitle}>Purchase Successful!</Text>
          <Text style={styles.successText}>
            Your {selectedItem?.name} has been purchased successfully.
          </Text>

          <TouchableOpacity
            style={styles.walletButton}
            onPress={handleAddToAppleWallet}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome5 name="apple" size={24} color="#fff" />
                <Text style={styles.authButtonText}>Add to Apple Wallet</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => setShowAppleWalletModal(false)}
          >
            <Text style={styles.modalCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCard = (pass) => (
    <View key={pass.id} style={styles.card}>
      <Image source={{ uri: pass.image }} style={styles.cardImage} />
      
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{pass.name}</Text>
            <Text style={styles.cardType}>{pass.type}</Text>
          </View>
          <View style={styles.supplyBadge}>
            <Text style={styles.supplyText}>{pass.supply}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceAmount}>{pass.price}</Text>
        </View>

        <TouchableOpacity 
          style={styles.benefitsButton}
          onPress={() => toggleBenefits(pass.id)}
        >
          <Text style={styles.benefitsButtonText}>
            View Benefits
          </Text>
          <MaterialIcons 
            name={showBenefits[pass.id] ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
            size={24} 
            color="#3B82F6" 
          />
        </TouchableOpacity>

        {showBenefits[pass.id] && (
          <View style={styles.benefitsContainer}>
            {pass.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={16} color="#22C55E" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
            <Text style={styles.merchantCount}>
              {pass.merchantCount}+ Authorized Merchants
            </Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.buyFiatButton}
            onPress={() => handlePurchase(pass, 'fiat')}
          >
            <FontAwesome5 name="credit-card" size={16} color="#fff" />
            <Text style={styles.buyButtonText}>Buy with Fiat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.buyCryptoButton}
            onPress={() => handlePurchase(pass, 'crypto')}
          >
            <FontAwesome5 name="wallet" size={16} color="#fff" />
            <Text style={styles.buyButtonText}>Buy with Crypto</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMarketplace = () => (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#1a237e', '#4a148c']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>WaveX Marketplace</Text>
        <Text style={styles.headerSubtitle}>Discover Premium NFT Passes</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Passes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featuredPasses.map(renderCard)}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {events.map((event) => (
            <TouchableOpacity 
              key={event.id} 
              style={styles.eventCard}
              onPress={() => handlePurchase(event, 'fiat')}
            >
              <Image source={{ uri: event.image }} style={styles.eventImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.eventOverlay}
              >
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventDate}>{event.date}</Text>
                  <Text style={styles.eventVenue}>{event.venue}</Text>
                  <Text style={styles.eventPrice}>{event.price}</Text>
                  <Text style={styles.eventRemaining}>{event.remaining}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.mainContainer}>
      {renderMarketplace()}
      {renderAuthModal()}
      {renderDetailModal()}
      {renderAppleWalletModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
    color: '#1a237e',
  },
  card: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginLeft: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardType: {
    fontSize: 14,
    color: '#6B7280',
  },
  supplyBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  supplyText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  benefitsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginBottom: 16,
  },
  benefitsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  benefitsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  merchantCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  buyFiatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buyCryptoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventCard: {
    width: 280,
    height: 200,
    marginLeft: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  eventInfo: {
    color: '#FFFFFF',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  eventVenue: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  eventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  eventRemaining: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  walletButton: {
    backgroundColor: '#1F2937',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  modalCancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#6B7280',
    fontSize: 16,
  },
  loader: {
    marginVertical: 16,
  },
  detailScroll: {
    maxHeight: '80%',
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsSection: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#93C5FD',
  },
  checkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default WaveXMarketplace;