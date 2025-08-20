import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, FlatList, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming, 
  interpolate,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [plantData, setPlantData] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [expandedDetail, setExpandedDetail] = useState(null);
  const [typewriterTextF, setTypewriterTextF] = useState('F');
  const [typewriterTextG, setTypewriterTextG] = useState('G');
  const [typewriterTextN, setTypewriterTextN] = useState('N');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const rotateAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const slideAnim = useSharedValue(-50);
  const breatheAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  
  // Loading plants animation
  const plant1Anim = useSharedValue(0.5);
  const plant2Anim = useSharedValue(0.5);
  const plant3Anim = useSharedValue(0.5);
  
  // Results page staggered animations
  const headerAnim = useSharedValue(0);
  const imagesAnim = useSharedValue(0);
  const mainResultAnim = useSharedValue(0);
  const detailsAnim = useSharedValue(0);
  const alternativesAnim = useSharedValue(0);
  const buttonsAnim = useSharedValue(0);
  
  // Individual demo animations for F, G, N
  const demoAnimF = useSharedValue(0);
  const demoAnimG = useSharedValue(0);
  const demoAnimN = useSharedValue(0);

  // Loading animation state
  const [loadingDots, setLoadingDots] = useState('');

  // Start animations when component mounts
  useEffect(() => {
    fadeAnim.value = withSpring(1, { damping: 15 });
    scaleAnim.value = withSpring(1, { damping: 12 });
    slideAnim.value = withSpring(0, { damping: 10 });
    
    // Enhanced breathing animation for the main button
    breatheAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );
    
    // Glow effect animation - mai subtil
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.3, { duration: 2500 })
      ),
      -1,
      false
    );
    
    // Loading plants animation - sequential growing
    const startPlantAnimations = () => {
      plant1Anim.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(0.5, { duration: 800 })
        ),
        -1,
        false
      );
      
      setTimeout(() => {
        plant2Anim.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 800 }),
            withTiming(0.5, { duration: 800 })
          ),
          -1,
          false
        );
      }, 300);
      
      setTimeout(() => {
        plant3Anim.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 800 }),
            withTiming(0.5, { duration: 800 })
          ),
          -1,
          false
        );
      }, 600);
    };
    
    startPlantAnimations();
    
    // Continuous pulse animation
    pulseAnim.value = withRepeat(
      withTiming(1.1, { duration: 2000 }),
      -1,
      true
    );
    
    // Continuous rotation for loading
    rotateAnim.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  // Loading animation effect
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev === '...') return '';
          return prev + '.';
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleTakePhoto = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        Alert.alert('Permissions Required', 'The app needs camera access to identify plants.');
        return;
      }
    }

    setShowCamera(true);
  };

  const handleCapturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
          base64: true,
        });
        
        setCapturedPhoto(photo.uri);
        setShowCamera(false);
        await identifyPlant(photo.uri);
        
      } catch (error) {
        Alert.alert('Error', 'Could not take photo!');
      }
    }
  };

  const identifyPlant = async (photoUri) => {
    try {
      setIsLoading(true);
      setLoadingDots('');
      
      const API_KEY = "2b10NWW9aUNd1ma33GmXyqu"; // Replace with your real API key
      const PROJECT = "all";
      
      const formData = new FormData();
      formData.append('images', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'plant.jpg',
      });
      formData.append('organs', 'auto');
      
      const response = await fetch(`https://my-api.plantnet.org/v2/identify/${PROJECT}?api-key=${API_KEY}&include-related-images=true&lang=en`, {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      setIsLoading(false);
      
      if (result.results && result.results.length > 0) {
        setPlantData(result);
        setShowResults(true);
      } else {
        Alert.alert('🤔 Unknown plant', 'Try a clearer photo or different angle');
      }
      
    } catch (error) {
      setIsLoading(false);
      Alert.alert('❌ Network Error', 'Check your internet connection');
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleBackToHome = () => {
    setShowResults(false);
    setPlantData(null);
    setCapturedPhoto(null);
    setExpandedDetail(null);
    setTypewriterTextF('F');
    setTypewriterTextG('G');
    setTypewriterTextN('N');
  };

  const handleTakeAnother = () => {
    setShowResults(false);
    setPlantData(null);
    setCapturedPhoto(null);
    setExpandedDetail(null);
    setTypewriterTextF('F');
    setTypewriterTextG('G');
    setTypewriterTextN('N');
    setShowCamera(true);
  };

  const handleImagePress = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  const handleDetailPress = (detailType) => {
    // Stop demo și reset la literele simple
    setTypewriterTextF('F');
    setTypewriterTextG('G');
    setTypewriterTextN('N');
    demoAnimF.value = withSpring(0, { damping: 15 });
    demoAnimG.value = withSpring(0, { damping: 15 });
    demoAnimN.value = withSpring(0, { damping: 15 });
    
    setExpandedDetail(expandedDetail === detailType ? null : detailType);
  };

  // Start results page animations
  const startResultsAnimations = () => {
    // Reset all animations
    headerAnim.value = 0;
    imagesAnim.value = 0;
    mainResultAnim.value = 0;
    detailsAnim.value = 0;
    alternativesAnim.value = 0;
    buttonsAnim.value = 0;
    demoAnimF.value = 0;
    demoAnimG.value = 0;
    demoAnimN.value = 0;

    // Staggered entrance animations
    headerAnim.value = withDelay(100, withSpring(1, { damping: 15 }));
    imagesAnim.value = withDelay(300, withSpring(1, { damping: 15 }));
    mainResultAnim.value = withDelay(500, withSpring(1, { damping: 12 }));
    detailsAnim.value = withDelay(700, withSpring(1, { damping: 15 }));
    alternativesAnim.value = withDelay(900, withSpring(1, { damping: 15 }));
    buttonsAnim.value = withDelay(1100, withSpring(1, { damping: 15 }));

    // Progressive demo wave: F → G → N
    setTimeout(() => {
      startProgressiveDemoWave();
    }, 1300);
  };

  // Typewriter effect helper
  const typewriterEffect = (targetText, currentText, setTextState, speed = 150) => {
    if (currentText.length < targetText.length) {
      const nextChar = targetText[currentText.length];
      setTimeout(() => {
        setTextState(currentText + nextChar);
      }, speed);
    }
  };

  // Reverse typewriter effect helper  
  const reverseTypewriterEffect = (targetText, currentText, setTextState, speed = 100) => {
    if (currentText.length > targetText.length) {
      setTimeout(() => {
        setTextState(currentText.slice(0, -1));
      }, speed);
    }
  };

  // Beautiful progressive typewriter wave animation - optimized timing
  const startProgressiveDemoWave = () => {
    // Reset all texts to single letters
    setTypewriterTextF('F');
    setTypewriterTextG('G');
    setTypewriterTextN('N');
    
    // F types to "Family" - faster and smoother
    setTimeout(() => {
      const targetF = 'Family';
      let currentF = 'F';
      
      const typeF = () => {
        if (currentF.length < targetF.length) {
          currentF += targetF[currentF.length];
          setTypewriterTextF(currentF);
          demoAnimF.value = withSpring(1, { damping: 18 }); // Smoother spring
          setTimeout(typeF, 60); // Faster typing: 60ms between letters
        } else {
          // Stay longer when complete: 1400ms
          setTimeout(() => {
            const reverseF = () => {
              if (currentF.length > 1) {
                currentF = currentF.slice(0, -1);
                setTypewriterTextF(currentF);
                setTimeout(reverseF, 50); // Even faster reverse
              } else {
                demoAnimF.value = withSpring(0, { damping: 18 });
              }
            };
            reverseF();
          }, 1400);
        }
      };
      typeF();
    }, 200);
    
    // G types to "Genus" - staggered timing
    setTimeout(() => {
      const targetG = 'Genus';
      let currentG = 'G';
      
      const typeG = () => {
        if (currentG.length < targetG.length) {
          currentG += targetG[currentG.length];
          setTypewriterTextG(currentG);
          demoAnimG.value = withSpring(1, { damping: 18 });
          setTimeout(typeG, 60);
        } else {
          setTimeout(() => {
            const reverseG = () => {
              if (currentG.length > 1) {
                currentG = currentG.slice(0, -1);
                setTypewriterTextG(currentG);
                setTimeout(reverseG, 50);
              } else {
                demoAnimG.value = withSpring(0, { damping: 18 });
              }
            };
            reverseG();
          }, 1400);
        }
      };
      typeG();
    }, 500); // Reduced stagger for better flow
    
    // N types to "Names" 
    setTimeout(() => {
      const targetN = 'Names';
      let currentN = 'N';
      
      const typeN = () => {
        if (currentN.length < targetN.length) {
          currentN += targetN[currentN.length];
          setTypewriterTextN(currentN);
          demoAnimN.value = withSpring(1, { damping: 18 });
          setTimeout(typeN, 60);
        } else {
          setTimeout(() => {
            const reverseN = () => {
              if (currentN.length > 1) {
                currentN = currentN.slice(0, -1);
                setTypewriterTextN(currentN);
                setTimeout(reverseN, 50);
              } else {
                demoAnimN.value = withSpring(0, { damping: 18 });
              }
            };
            reverseN();
          }, 1400);
        }
      };
      typeN();
    }, 800);
  };

  // Start results animations when data changes
  useEffect(() => {
    if (showResults && plantData) {
      startResultsAnimations();
    }
  }, [showResults, plantData]);

  // Helper function pentru text în icon-uri - cu typewriter effect
  const getIconText = (detailType, shortText, fullText) => {
    // Prioritate: manual expand > typewriter demo > short text
    if (expandedDetail === detailType) return fullText;
    
    // Typewriter demo text pentru fiecare
    if (detailType === 'family') return typewriterTextF;
    if (detailType === 'genus') return typewriterTextG;
    if (detailType === 'names') return typewriterTextN;
    
    // Fallback la scurt
    return shortText;
  };

  // Fixed animated styles - toate hooks-urile sus pentru consistență
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { scale: scaleAnim.value },
      { translateY: slideAnim.value }
    ],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const animatedRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const enhancedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breatheAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value * 0.7 + 0.3, // Mai subtil
    transform: [{ scale: 1 + glowAnim.value * 0.05 }], // Mai puțin dramatic
  }));

  // Hook pentru plant images - mereu apelat
  const plantImageStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  // Hook pentru loading icons - mereu apelat
  const loadingIconStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  // Hook pentru feature cards - mereu apelat
  const featureCardStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ 
      translateY: interpolate(
        slideAnim.value,
        [-50, 0],
        [-30, 0]
      )
    }]
  }));

  // Hooks pentru loading plants animation
  const plant1Style = useAnimatedStyle(() => ({
    transform: [{ scale: plant1Anim.value }],
    opacity: interpolate(plant1Anim.value, [0.5, 1.2], [0.6, 1]),
  }));

  const plant2Style = useAnimatedStyle(() => ({
    transform: [{ scale: plant2Anim.value }],
    opacity: interpolate(plant2Anim.value, [0.5, 1.2], [0.6, 1]),
  }));

  const plant3Style = useAnimatedStyle(() => ({
    transform: [{ scale: plant3Anim.value }],
    opacity: interpolate(plant3Anim.value, [0.5, 1.2], [0.6, 1]),
  }));

  // Results page staggered animation hooks
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value, [0, 1], [30, 0]) }],
  }));

  const imagesAnimStyle = useAnimatedStyle(() => ({
    opacity: imagesAnim.value,
    transform: [{ translateY: interpolate(imagesAnim.value, [0, 1], [30, 0]) }],
  }));

  const mainResultAnimStyle = useAnimatedStyle(() => ({
    opacity: mainResultAnim.value,
    transform: [
      { translateY: interpolate(mainResultAnim.value, [0, 1], [30, 0]) },
      { scale: interpolate(mainResultAnim.value, [0, 1], [0.9, 1]) },
    ],
  }));

  const detailsAnimStyle = useAnimatedStyle(() => ({
    opacity: detailsAnim.value,
    transform: [{ translateY: interpolate(detailsAnim.value, [0, 1], [30, 0]) }],
  }));

  const alternativesAnimStyle = useAnimatedStyle(() => ({
    opacity: alternativesAnim.value,
    transform: [{ translateY: interpolate(alternativesAnim.value, [0, 1], [30, 0]) }],
  }));

  const buttonsAnimStyle = useAnimatedStyle(() => ({
    opacity: buttonsAnim.value,
    transform: [{ translateY: interpolate(buttonsAnim.value, [0, 1], [30, 0]) }],
  }));

  // Individual demo animation styles
  const demoAnimStyleF = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(demoAnimF.value, [0, 1], [1, 1.1]) }],
    opacity: interpolate(demoAnimF.value, [0, 1], [1, 0.8]),
  }));

  const demoAnimStyleG = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(demoAnimG.value, [0, 1], [1, 1.1]) }],
    opacity: interpolate(demoAnimG.value, [0, 1], [1, 0.8]),
  }));

  const demoAnimStyleN = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(demoAnimN.value, [0, 1], [1, 1.1]) }],
    opacity: interpolate(demoAnimN.value, [0, 1], [1, 0.8]),
  }));

  // Render plant reference images - cu touch pentru zoom
  const renderPlantImage = ({ item, index }) => (
    <Animated.View 
      style={[styles.imageContainer, plantImageStyle]}
    >
      <TouchableOpacity onPress={() => handleImagePress(item.url.o || item.url.m)}>
        <Image 
          source={{ uri: item.url.m }} 
          style={styles.plantImage}
        />
        <BlurView intensity={80} style={styles.imageOverlay}>
          <Text style={styles.imageOrgan}>{item.organ}</Text>
        </BlurView>
        {/* Indicator că e touchable */}
        <View style={styles.zoomIndicator}>
          <View style={styles.zoomDot} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Loading Screen
  if (isLoading) {
    return (
      <LinearGradient
        colors={['#0a0e27', '#16213e', '#0f3460']}
        style={styles.loadingContainer}
      >
        <Animated.View style={[styles.loadingContent, animatedContainerStyle]}>
          {/* Loading Plants Icons - Sequential Animation */}
          <View style={styles.loadingPlantsContainer}>
            {/* Plant 1 - Seedling */}
            <Animated.View style={[styles.plantIconContainer, plant1Style]}>
              <View style={styles.seedling}>
                <View style={styles.seedlingStem} />
                <View style={styles.seedlingLeaf1} />
                <View style={styles.seedlingLeaf2} />
              </View>
            </Animated.View>
            
            {/* Plant 2 - Flower */}
            <Animated.View style={[styles.plantIconContainer, plant2Style]}>
              <View style={styles.flower}>
                <View style={styles.flowerStem} />
                <View style={styles.flowerPetals}>
                  <View style={styles.petal1} />
                  <View style={styles.petal2} />
                  <View style={styles.petal3} />
                  <View style={styles.petal4} />
                </View>
                <View style={styles.flowerCenter} />
              </View>
            </Animated.View>
            
            {/* Plant 3 - Tree */}
            <Animated.View style={[styles.plantIconContainer, plant3Style]}>
              <View style={styles.tree}>
                <View style={styles.treeTrunk} />
                <View style={styles.treeCrown} />
                <View style={styles.treeLeaves1} />
                <View style={styles.treeLeaves2} />
              </View>
            </Animated.View>
          </View>
          
          <Animated.Text style={[styles.loadingTitle, animatedPulseStyle]}>
            Analyzing Plant{loadingDots}
          </Animated.Text>
          <Text style={styles.loadingSubtitle}>Our AI is identifying your plant species</Text>
          
          <Animated.View style={[styles.loadingCircle, animatedRotateStyle]}>
            <LinearGradient
              colors={['#64ffda', '#4fd1c7', '#26a69a']}
              style={styles.loadingGradientCircle}
            >
              <ActivityIndicator size="large" color="#0a0e27" />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </LinearGradient>
    );
  }

  // Results Screen
  if (showResults && plantData) {
    const topResult = plantData.results[0];
    const confidence = (topResult.score * 100).toFixed(1);
    
    // Get diverse plant reference images from API (prioritize variety)
    const getPlantImages = (images) => {
      if (!images || images.length === 0) return [];
      
      // Group images by organ type
      const organGroups = {};
      images.forEach(img => {
        if (!organGroups[img.organ]) {
          organGroups[img.organ] = [];
        }
        organGroups[img.organ].push(img);
      });
      
      // Prioritize showing different organ types
      const priorityOrder = ['habit', 'flower', 'fruit', 'leaf', 'bark'];
      const selectedImages = [];
      
      // First, get one image from each organ type (prioritized)
      priorityOrder.forEach(organ => {
        if (organGroups[organ] && selectedImages.length < 6) {
          selectedImages.push(organGroups[organ][0]);
        }
      });
      
      // Then fill remaining slots with any available images
      images.forEach(img => {
        if (selectedImages.length < 6 && !selectedImages.find(selected => selected.url.m === img.url.m)) {
          selectedImages.push(img);
        }
      });
      
      return selectedImages;
    };
    
    const plantImages = getPlantImages(topResult.images);
    
    return (
      <LinearGradient
        colors={['#0a0e27', '#16213e', '#0f3460']}
        style={styles.resultsContainer}
      >
        <StatusBar style="light" />
        
        {/* Header with gradient - animated */}
        <Animated.View style={[styles.resultsHeader, headerAnimStyle]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToHome}>
            <BlurView intensity={80} style={styles.backButtonBlur}>
              <Text style={styles.backButtonText}>← Back</Text>
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.resultsHeaderTitle}>Plant Identified!</Text>
        </Animated.View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Plant Reference Images - animated */}
          {plantImages.length > 0 && (
            <Animated.View style={[styles.imagesSection, imagesAnimStyle]}>
              <Text style={styles.imagesSectionTitle}>Reference Gallery</Text>
              <FlatList
                data={plantImages}
                renderItem={renderPlantImage}
                keyExtractor={(item, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesList}
              />
            </Animated.View>
          )}

          {/* Main Result Card - animated */}
          <Animated.View style={[styles.mainResultWrapper, mainResultAnimStyle]}>
            <Animated.View style={[styles.confidenceBadge, animatedPulseStyle]}>
              <LinearGradient
                colors={['#64ffda', '#4fd1c7']}
                style={styles.confidenceGradient}
              >
                <Text style={styles.confidenceText}>{confidence}% match</Text>
              </LinearGradient>
            </Animated.View>
            
            <BlurView intensity={100} style={styles.mainResult}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                style={styles.mainResultGradient}
              >
                <Text style={styles.scientificName}>
                  {topResult.species.scientificNameWithoutAuthor}
                </Text>
                
                {topResult.species.commonNames && topResult.species.commonNames.length > 0 && (
                  <Text style={styles.commonName}>
                    {topResult.species.commonNames[0]}
                  </Text>
                )}
              </LinearGradient>
            </BlurView>
          </Animated.View>

          {/* Details Glass Card - animated */}
          <Animated.View style={[styles.glassCard, detailsAnimStyle]}>
            <BlurView intensity={100} style={styles.glassCardBlur}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                style={styles.glassCardGradient}
              >
                <Text style={styles.sectionTitle}>Plant Details</Text>
                
                <TouchableOpacity 
                  style={styles.detailRow}
                  onPress={() => handleDetailPress('family')}
                  activeOpacity={0.7}
                >
                  <Animated.View style={demoAnimStyleF}>
                    <LinearGradient
                      colors={['#64ffda', '#4fd1c7']}
                      style={styles.detailIcon}
                    >
                      <Text style={styles.detailIconText}>
                        {getIconText('family', 'F', 'Family')}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailValue}>
                      {topResult.species.family?.scientificNameWithoutAuthor || 'Unknown'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.detailRow}
                  onPress={() => handleDetailPress('genus')}
                  activeOpacity={0.7}
                >
                  <Animated.View style={demoAnimStyleG}>
                    <LinearGradient
                      colors={['#64ffda', '#4fd1c7']}
                      style={styles.detailIcon}
                    >
                      <Text style={styles.detailIconText}>
                        {getIconText('genus', 'G', 'Genus')}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailValue}>
                      {topResult.species.genus?.scientificNameWithoutAuthor || 'Unknown'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {topResult.species.commonNames && topResult.species.commonNames.length > 1 && (
                  <TouchableOpacity 
                    style={styles.detailRow}
                    onPress={() => handleDetailPress('names')}
                    activeOpacity={0.7}
                  >
                    <Animated.View style={demoAnimStyleN}>
                      <LinearGradient
                        colors={['#64ffda', '#4fd1c7']}
                        style={styles.detailIcon}
                      >
                        <Text style={styles.detailIconText}>
                          {getIconText('names', 'N', 'Names')}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailValue}>
                        {topResult.species.commonNames.slice(1).join(', ')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </BlurView>
          </Animated.View>

          {/* Alternative Results - animated */}
          {plantData.results.length > 1 && (
            <Animated.View style={[styles.glassCard, alternativesAnimStyle]}>
              <BlurView intensity={100} style={styles.glassCardBlur}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.1)']}
                  style={styles.glassCardGradient}
                >
                  <Text style={styles.sectionTitle}>Other Possibilities</Text>
                  {plantData.results.slice(1, 3).map((result, index) => (
                    <View key={index} style={styles.alternativeItem}>
                      <View style={styles.alternativeLeft}>
                        <Text style={styles.alternativeName}>
                          {result.species.scientificNameWithoutAuthor}
                        </Text>
                        {result.species.commonNames && result.species.commonNames[0] && (
                          <Text style={styles.alternativeCommon}>
                            {result.species.commonNames[0]}
                          </Text>
                        )}
                      </View>
                      <LinearGradient
                        colors={['rgba(100, 255, 218, 0.3)', 'rgba(79, 209, 199, 0.2)']}
                        style={styles.alternativeRight}
                      >
                        <Text style={styles.alternativeConfidence}>
                          {(result.score * 100).toFixed(1)}%
                        </Text>
                      </LinearGradient>
                    </View>
                  ))}
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

          {/* Action Buttons - animated */}
          <Animated.View style={[styles.actionButtons, buttonsAnimStyle]}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleTakeAnother}>
              <BlurView intensity={80} style={styles.buttonBlur}>
                <Text style={styles.secondaryButtonText}>Take Another</Text>
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleBackToHome}>
              <LinearGradient
                colors={['#64ffda', '#4fd1c7']}
                style={styles.buttonGradient}
              >
                <Text style={styles.primaryButtonText}>Save to Collection</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <View style={styles.imageModal}>
            <TouchableOpacity 
              style={styles.imageModalOverlay} 
              onPress={handleCloseImageModal}
              activeOpacity={1}
            >
              <View style={styles.imageModalContent}>
                <TouchableOpacity 
                  style={styles.imageModalClose}
                  onPress={handleCloseImageModal}
                >
                  <BlurView intensity={80} style={styles.imageModalCloseBlur}>
                    <Text style={styles.imageModalCloseText}>✕</Text>
                  </BlurView>
                </TouchableOpacity>
                <Image 
                  source={{ uri: selectedImage }}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    );
  }

  // Fixed Camera Screen - folosim absolute positioning
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} />
        
        {/* Top Controls - absolute positioning */}
        <View style={styles.cameraTopControls}>
          <TouchableOpacity style={styles.cameraCloseButton} onPress={handleCloseCamera}>
            <BlurView intensity={80} style={styles.cameraCloseBlur}>
              <Text style={styles.cameraCloseText}>✕</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Grid Lines - absolute positioning */}
        <View style={styles.gridContainer}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, styles.gridLineVertical]} />
          <View style={[styles.gridLine, styles.gridLineHorizontal1]} />
          <View style={[styles.gridLine, styles.gridLineHorizontal2]} />
        </View>

        {/* Bottom Controls - absolute positioning */}
        <View style={styles.cameraBottomControls}>
          <View style={styles.cameraControlsSide}>
            {/* Empty space for balance */}
          </View>
          
          {/* Main Capture Button */}
          <Animated.View style={[styles.captureButtonContainer, animatedPulseStyle]}>
            <TouchableOpacity onPress={handleCapturePhoto} style={styles.captureButtonOuter}>
              <View style={styles.captureButtonInner}>
                <LinearGradient
                  colors={['#ffffff', '#f0f0f0']}
                  style={styles.captureButtonGradient}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.cameraControlsSide}>
            {/* Gallery button could go here */}
          </View>
        </View>
      </View>
    );
  }

  // Home Screen - Enhanced
  return (
    <LinearGradient
      colors={['#0a0e27', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <Animated.View style={[styles.homeContent, animatedContainerStyle]}>
        <View style={styles.logoContainer}>
          {/* Logo area - pregătit pentru logo custom */}
          <Animated.View style={[styles.logoIconContainer, animatedPulseStyle]}>
            {/* Placeholder pentru logo - înlocuiește cu <Image> când ai logo-ul */}
            <View style={styles.logoPlaceholder}>
              <View style={styles.leafIcon}>
                <View style={styles.leafShape} />
                <View style={styles.leafVein} />
              </View>
            </View>
          </Animated.View>
          <Text style={styles.title}>FloraLens</Text>
          <Text style={styles.subtitle}>Discover the world of plants</Text>
        </View>
        
        <BlurView intensity={80} style={styles.homeCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.homeCardGradient}
          >
            <Text style={styles.cardTitle}>AI Plant Identification</Text>
            <Text style={styles.cardSubtitle}>
              Take a photo and let our advanced AI identify any plant species instantly
            </Text>
            
          {/* Enhanced Take Photo Button - Fixed */}
            <View style={styles.enhancedButtonContainer}>
              {/* Subtle wave effect background - fără cerc mare */}
              <Animated.View style={[styles.waveContainer, glowStyle]}>
                <View style={styles.wave1} />
                <View style={styles.wave2} />
                <View style={styles.wave3} />
              </Animated.View>
              
              {/* Main button - fără particule */}
              <Animated.View style={[styles.enhancedButton, enhancedButtonStyle]}>
                <TouchableOpacity onPress={handleTakePhoto}>
                  <LinearGradient
                    colors={['#64ffda', '#4fd1c7', '#26a69a']}
                    style={styles.enhancedButtonGradient}
                  >
                    <View style={styles.buttonContent}>
                      <View style={styles.cameraIconContainer}>
                        <View style={styles.cameraIconShape}>
                          <View style={styles.cameraLens} />
                        </View>
                        <View style={styles.scanLine} />
                      </View>
                      <Text style={styles.buttonText}>Take Photo</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Simplified Feature Grid */}
        <View style={styles.featureGrid}>
          {[
            { icon: '⚡', title: 'AI Powered', text: 'Neural networks' },
            { icon: '⚡', title: 'Instant Results', text: 'Fast ID' },
            { icon: '🌍', title: 'Global Database', text: 'Million species' },
            { icon: '📊', title: 'Detailed Info', text: 'Scientific data' }
          ].map((feature, index) => (
            <Animated.View 
              key={index}
              style={[
                styles.featureCard,
                featureCardStyle,
                { transform: [{ translateY: (index % 2) * 5 }] }
              ]}
            >
              <BlurView intensity={60} style={styles.featureCardBlur}>
                <View style={styles.featureIconContainer}>
                  <View style={styles.featureIconDot} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureText}>{feature.text}</Text>
              </BlurView>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
      
      <StatusBar style="light" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // Home Screen Styles
  container: {
    flex: 1,
  },
  homeContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
    width: '100%',
  },
  logoIconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    // Când adaugi logo-ul, înlocuiește cu:
    // backgroundColor: 'transparent', 
    // sau elimină complet acest View
  },
  leafIcon: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leafShape: {
    width: 50,
    height: 70,
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#64ffda',
    borderRadius: 25,
    transform: [{ rotate: '15deg' }],
    shadowColor: '#64ffda',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  leafVein: {
    position: 'absolute',
    width: 2,
    height: 50,
    backgroundColor: '#64ffda',
    top: 15,
    left: '50%',
    marginLeft: -1,
    transform: [{ rotate: '15deg' }],
    opacity: 0.7,
  },
  title: {
    fontSize: 38,
    fontWeight: '300', // Mai subțire pentru look caligrafic
    color: '#FFFFFF',
    letterSpacing: 2, // Mai mult spacing pentru eleganță
    textAlign: 'center',
    fontStyle: 'italic', // Cursiv pentru look caligrafic
    textShadowColor: 'rgba(100, 255, 218, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    paddingHorizontal: 10,
    width: '100%',
  },
  subtitle: {
    fontSize: 18,
    color: '#64ffda',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  homeCard: {
    borderRadius: 28,
    marginBottom: 40,
    overflow: 'hidden',
  },
  homeCardGradient: {
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
    borderRadius: 28,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#B2DFDB',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Enhanced Button Styles
  enhancedButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 100,
    overflow: 'hidden', // Conține wave-urile în container
  },
  waveContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  wave1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
    backgroundColor: 'rgba(100, 255, 218, 0.05)',
  },
  wave2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.15)',
    backgroundColor: 'rgba(100, 255, 218, 0.03)',
  },
  wave3: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.1)',
    backgroundColor: 'rgba(100, 255, 218, 0.02)',
  },
  enhancedButton: {
    borderRadius: 25,
    overflow: 'hidden',
    zIndex: 3,
    elevation: 10,
    shadowColor: '#64ffda',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  enhancedButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cameraIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cameraIconShape: {
    width: 24,
    height: 18,
    backgroundColor: '#0a0e27',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#64ffda',
    backgroundColor: 'transparent',
  },
  scanLine: {
    position: 'absolute',
    bottom: -3,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#0a0e27',
    opacity: 0.3,
  },
  buttonText: {
    color: '#0a0e27',
    fontSize: 18,
    fontWeight: '800',
  },

  // Fixed Feature Grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  featureCard: {
    width: (width - 60) / 2, // Fixed width calculation
    height: 120,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  featureCardBlur: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 255, 218, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#64ffda',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 11,
    color: '#B2DFDB',
    textAlign: 'center',
  },

  // Fixed Camera Screen Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraTopControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cameraCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  cameraCloseBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cameraCloseText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    left: '50%',
    marginLeft: -0.5,
  },
  gridLineHorizontal1: {
    height: 1,
    width: '100%',
    top: '33.33%',
    marginTop: -0.5,
  },
  gridLineHorizontal2: {
    height: 1,
    width: '100%',
    top: '66.66%',
    marginTop: -0.5,
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  cameraControlsSide: {
    width: 60,
    alignItems: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  captureButtonGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingPlantsContainer: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Seedling Icon
  seedling: {
    position: 'relative',
    width: 40,
    height: 50,
    alignItems: 'center',
  },
  seedlingStem: {
    width: 3,
    height: 30,
    backgroundColor: '#64ffda',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  seedlingLeaf1: {
    width: 16,
    height: 12,
    backgroundColor: '#4fd1c7',
    borderRadius: 8,
    position: 'absolute',
    top: 5,
    left: 5,
    transform: [{ rotate: '15deg' }],
  },
  seedlingLeaf2: {
    width: 14,
    height: 10,
    backgroundColor: '#26a69a',
    borderRadius: 7,
    position: 'absolute',
    top: 15,
    right: 8,
    transform: [{ rotate: '-20deg' }],
  },
  
  // Flower Icon
  flower: {
    position: 'relative',
    width: 40,
    height: 50,
    alignItems: 'center',
  },
  flowerStem: {
    width: 3,
    height: 25,
    backgroundColor: '#64ffda',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  flowerPetals: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  petal1: {
    width: 12,
    height: 8,
    backgroundColor: '#4fd1c7',
    borderRadius: 6,
    position: 'absolute',
    top: 2,
  },
  petal2: {
    width: 12,
    height: 8,
    backgroundColor: '#4fd1c7',
    borderRadius: 6,
    position: 'absolute',
    bottom: 2,
  },
  petal3: {
    width: 12,
    height: 8,
    backgroundColor: '#4fd1c7',
    borderRadius: 6,
    position: 'absolute',
    left: 2,
    transform: [{ rotate: '90deg' }],
  },
  petal4: {
    width: 12,
    height: 8,
    backgroundColor: '#4fd1c7',
    borderRadius: 6,
    position: 'absolute',
    right: 2,
    transform: [{ rotate: '90deg' }],
  },
  flowerCenter: {
    width: 8,
    height: 8,
    backgroundColor: '#26a69a',
    borderRadius: 4,
    position: 'absolute',
    top: 11,
    alignSelf: 'center',
  },
  
  // Tree Icon
  tree: {
    position: 'relative',
    width: 40,
    height: 50,
    alignItems: 'center',
  },
  treeTrunk: {
    width: 6,
    height: 20,
    backgroundColor: '#64ffda',
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
  },
  treeCrown: {
    width: 24,
    height: 24,
    backgroundColor: '#4fd1c7',
    borderRadius: 12,
    position: 'absolute',
    top: 6,
  },
  treeLeaves1: {
    width: 16,
    height: 16,
    backgroundColor: '#26a69a',
    borderRadius: 8,
    position: 'absolute',
    top: 10,
    left: 4,
  },
  treeLeaves2: {
    width: 16,
    height: 16,
    backgroundColor: '#26a69a',
    borderRadius: 8,
    position: 'absolute',
    top: 10,
    right: 4,
  },
  
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginTop: 20,
  },
  loadingGradientCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#64ffda',
    marginBottom: 40,
  },

  // Results Screen Styles
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonBlur: {
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
  },
  backButtonText: {
    color: '#64ffda',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsHeaderTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginLeft: 20,
  },
  scrollContent: {
    flex: 1,
  },

  // Plant Images Section
  imagesSection: {
    paddingVertical: 24,
  },
  imagesSectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 20,
    marginBottom: 16,
  },
  imagesList: {
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  plantImage: {
    width: 180,
    height: 180,
    borderRadius: 20,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  imageOrgan: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  zoomIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(100, 255, 218, 0.8)',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0a0e27',
  },

  // Main Result
  mainResultWrapper: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  confidenceBadge: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  confidenceGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  confidenceText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: '900',
  },
  mainResult: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  mainResultGradient: {
    padding: 32,
    alignItems: 'center',
  },
  scientificName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  commonName: {
    fontSize: 20,
    color: '#B2DFDB',
    textAlign: 'center',
    fontWeight: '700',
  },

  // Glass Cards
  glassCard: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassCardBlur: {
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.2)',
  },
  glassCardGradient: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    paddingHorizontal: 8,
  },
  detailIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0a0e27',
    textAlign: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  alternativeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  alternativeLeft: {
    flex: 1,
  },
  alternativeName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: 2,
  },
  alternativeCommon: {
    fontSize: 14,
    color: '#B2DFDB',
    fontWeight: '600',
  },
  alternativeRight: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  alternativeConfidence: {
    fontSize: 14,
    color: '#0a0e27',
    fontWeight: '800',
  },

  // Image Modal Styles
  imageModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  imageModalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1001,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  imageModalCloseBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  imageModalCloseText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    margin: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  primaryButtonText: {
    color: '#0a0e27',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#64ffda',
  },
  buttonBlur: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#64ffda',
    fontSize: 16,
    fontWeight: '800',
  },
  bottomSpacing: {
    height: 40,
  },
});