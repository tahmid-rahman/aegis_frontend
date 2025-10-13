// app/(agent)/emergency-details.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { api } from '../../services/api';

interface EmergencyAlert {
  alert_id: string;
  user: number;
  user_info: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
  };
  emergency_type: string;
  initial_address: string;
  initial_latitude: number | null;
  initial_longitude: number | null;
  severity_level: string;
  activated_at: string;
  status: string;
  activation_method: string;
  description: string;
  location_updates: {
    id: number;
    latitude: number;
    longitude: number;
    timestamp: string;
    accuracy: number;
  }[];
  media_captures: {
    id: number;
    media_type: string;
    file: string;
    file_size: number;
    duration: number;
    captured_at: string;
    mime_type: string;
  }[];
  responses: {
    id: number;
    status: string;
    eta_minutes: number;
    notes: string;
    responder_info: {
      id: number;
      full_name: string;
      responder_type: string;
      phone: string;
    };
    notified_at: string;
    accepted_at: string;
    dispatched_at: string;
    arrived_at: string;
    completed_at: string;
  }[];
  emergency_contacts: {
    name: string;
    phone: string;
    relationship: string;
    is_primary: boolean;
  }[];
}

export default function EmergencyDetails() {
  const router = useRouter();
  const { alertId } = useLocalSearchParams();
  const { user } = useAuth();
  const [emergency, setEmergency] = useState<EmergencyAlert | null>(null);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState<{[key: number]: boolean}>({});
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaModalVisible, setMediaModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get base URL for media files
  const getMediaUrl = (filePath: string) => {
    if (!filePath) {
      return null;
    }
    
    const baseUrl = process.env.EXPO_PUBLIC_URL;
    const mediaUrl = `${baseUrl}${filePath}`;
    
    return mediaUrl;
  };

  // Fetch emergency details
  const fetchEmergencyDetails = async () => {
    try {
      setRefreshing(true);
      
      const response = await api.get(`/aegis/emergency/${alertId}/`);
      
      if (response.data.success) {
        const emergencyData = response.data.data;
        setEmergency(emergencyData);
        
        // Find the current responder's response
        const responderResponse = emergencyData.responses?.find(
          (r: any) => r.responder_info?.id === user?.id
        );
        
        setCurrentResponse(responderResponse || null);
      } else {
        console.error('API returned error:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching emergency details:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', 'Failed to load emergency details');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (alertId) {
      fetchEmergencyDetails();
      
      // Start timer for response time
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [alertId]);

  // Enhanced status update function
  const handleStatusUpdate = async (newStatus: string, notes?: string) => {
    try {
      // If no current response exists, we need to create one first
      if (!currentResponse && newStatus === 'accepted') {
        await handleCreateResponseAssignment();
        return;
      }

      if (!currentResponse?.id) {
        Alert.alert('Error', 'No response assignment found. Please accept the emergency first.');
        return;
      }

      const updateData = {
        response_id: currentResponse.id,
        status: newStatus,
        notes: notes || '',
        eta_minutes: calculateETA(newStatus),
      };

      const apiResponse = await api.post('/aegis/responder/update-status/', updateData);
      
      if (apiResponse.data.success) {
        // Update local state immediately
        setCurrentResponse(prev => prev ? { ...prev, status: newStatus } : null);
        
        let message = '';
        let shouldUpdateResponderStatus = false;
        
        switch (newStatus) {
          case 'accepted':
            message = 'You have accepted this emergency assignment.';
            shouldUpdateResponderStatus = true;
            break;
          case 'en_route':
            message = 'You are now en route to the victim.';
            shouldUpdateResponderStatus = true;
            break;
          case 'on_scene':
            message = 'You have arrived at the scene.';
            break;
          case 'completed':
            // Don't show alert for completed status - we'll show the report option instead
            shouldUpdateResponderStatus = true;
            break;
        }
        
        // Update responder status if needed
        if (shouldUpdateResponderStatus && user?.id) {
          const responderStatus = newStatus === 'completed' ? 'available' : 'busy';
          try {
            await api.patch(`/auth/responders/${user.id}/status/`, {
              status: responderStatus
            });
          } catch (error) {
            console.error('Error updating responder status:', error);
          }
        }
        
        // Only show alert for non-completed statuses
        // if (newStatus !== 'completed' && message) {
        //   Alert.alert('Status Updated', message);
        // }
        
        // For completed status, show report option
        if (newStatus === 'completed') {
          showReportOption();
        }
        
        // Refresh data to get updated information
        setTimeout(() => {
          fetchEmergencyDetails();
        }, 500);
      } else {
        Alert.alert('Error', apiResponse.data.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update status');
    }
  };

  // Show report option when emergency is completed
  const showReportOption = () => {
    Alert.alert(
      'Emergency Completed',
      'Would you like to submit an incident report?',
      [
        {
          text: 'Submit Report',
          onPress: () => router.push(`/(agent)/incident-report?alertId=${alertId}`)
        },
        {
          text: 'Maybe Later',
          style: 'cancel',
          onPress: () => {
            // Optional: Add any cleanup or navigation here
            router.back(); // Or navigate to home/dashboard
          }
        }
      ]
    );
  };

  // Create response assignment first
  const handleCreateResponseAssignment = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const response = await api.post('/aegis/emergency/assign-responder/', {
        alert_id: alertId,
        responder_id: user.id,
        notes: "Responder accepted the emergency"
      });

      if (response.data.success) {
        // Update responder status to busy
        try {
          await api.patch(`/account/responders/${user.id}/status/`, {
            status: 'busy'
          });
        } catch (error) {
          console.error('Error updating responder status:', error);
        }

        // Refresh to get the new response ID
        await fetchEmergencyDetails();
        
        // Now update status to accepted
        setTimeout(() => {
          handleStatusUpdate('accepted', 'Responder accepted the emergency assignment');
        }, 1000);
      } else {
        Alert.alert('Error', response.data.error || 'Failed to accept emergency');
      }
    } catch (error: any) {
      console.error('Error creating response assignment:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Failed to accept emergency');
    }
  };

  // Enhanced media viewing with better URL handling
  const handleViewMedia = async (media: any) => {
    try {
      setLoadingMedia(prev => ({ ...prev, [media.id]: true }));
      
      const mediaUrl = getMediaUrl(media.file);
      
      if (!mediaUrl) {
        Alert.alert('Error', 'Media file URL could not be generated');
        return;
      }

      if (media.media_type === 'photo') {
        // Show image in modal
        setImageError(false);
        setSelectedMedia({ ...media, url: mediaUrl });
        setMediaModalVisible(true);
      } else {
        // For audio and video, try to open in default app
        const canOpen = await Linking.canOpenURL(mediaUrl);
        if (canOpen) {
          Linking.openURL(mediaUrl).catch(() => {
            // Fallback: Show media info
            showMediaInfo(media, mediaUrl);
          });
        } else {
          showMediaInfo(media, mediaUrl);
        }
      }
    } catch (error) {
      console.error('Error handling media:', error);
      Alert.alert('Error', 'Failed to load media. The file might not be accessible.');
    } finally {
      setLoadingMedia(prev => ({ ...prev, [media.id]: false }));
    }
  };

  // Helper function to show media info
  const showMediaInfo = (media: any, mediaUrl: string) => {
    Alert.alert(
      `${media.media_type.toUpperCase()} Details`,
      `File: ${media.file}\n` +
      `Type: ${media.mime_type || 'Unknown'}\n` +
      `Duration: ${media.duration || 'Unknown'}s\n` +
      `Size: ${(media.file_size / 1024 / 1024).toFixed(2)} MB\n` +
      `Captured: ${new Date(media.captured_at).toLocaleString()}\n\n` +
      `URL: ${mediaUrl}`,
      [{ text: 'OK' }]
    );
  };

  const handleCallVictim = () => {
    if (emergency?.user_info?.phone) {
      Alert.alert(
        "Call Victim",
        `Call ${emergency.user_info.phone}?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Call",
            onPress: () => Linking.openURL(`tel:${emergency.user_info.phone}`)
          }
        ]
      );
    } else {
      Alert.alert(
        "Cannot Call Victim",
        "Victim phone number is not available.",
        [{ text: "OK" }]
      );
    }
  };

  const handleCallEmergencyContact = (contact: any) => {
    Alert.alert(
      `Call ${contact.name}`,
      `Call ${contact.phone}? (${contact.relationship})`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Call",
          onPress: () => Linking.openURL(`tel:${contact.phone}`)
        }
      ]
    );
  };

  const handleNavigateToLocation = () => {
    if (emergency?.initial_latitude && emergency?.initial_longitude) {
      const url = `https://maps.google.com/?q=${emergency.initial_latitude},${emergency.initial_longitude}`;
      Linking.openURL(url).catch(err => 
        Alert.alert('Error', 'Could not open maps application.')
      );
    } else {
      Alert.alert('Location Error', 'Victim location not available for navigation.');
    }
  };

  const calculateETA = (status: string): number => {
    switch (status) {
      case 'en_route': return 5;
      case 'on_scene': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'notified': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'en_route': return 'bg-orange-500';
      case 'on_scene': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimeElapsed = (timestamp: string) => {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const then = new Date(timestamp);
    
    if (isNaN(then.getTime())) return 'Invalid time';
    
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Safe coordinate formatting
  const formatCoordinate = (coord: any): string => {
    if (coord === null || coord === undefined) return 'N/A';
    if (typeof coord !== 'number') {
      const num = parseFloat(coord);
      if (!isNaN(num)) return num.toFixed(6);
      return 'N/A';
    }
    if (isNaN(coord)) return 'N/A';
    return coord.toFixed(6);
  };

  if (!emergency) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Text className="text-on-surface">Loading emergency details...</Text>
      </View>
    );
  }

  const responderStatus = currentResponse?.status || 'notified';
  const hasMedia = emergency.media_captures && emergency.media_captures.length > 0;

  return (
    <View className="flex-1 bg-background">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchEmergencyDetails} />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-headline text-on-surface">Emergency Details</Text>
            <View className={`px-3 py-1 rounded-full ${getPriorityColor(emergency.severity_level)}`}>
              <Text className="text-white text-sm">{emergency.severity_level.toUpperCase()}</Text>
            </View>
          </View>
          <Text className="text-body text-on-surface-variant">
            Emergency #{emergency.alert_id} • {formatTimeElapsed(emergency.activated_at)}
          </Text>
        </View>

        {/* Enhanced Status Progress with ALL buttons */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Response Status</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between mb-4">
              {['notified', 'accepted', 'en_route', 'on_scene', 'completed'].map((status, index) => (
                <View key={status} className="items-center flex-1">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    responderStatus === status ? getStatusColor(status) : 'bg-gray-300'
                  }`}>
                    <Text className="text-white text-sm">{index + 1}</Text>
                  </View>
                  <Text className={`text-xs mt-1 text-center ${
                    responderStatus === status ? 'text-on-surface font-medium' : 'text-on-surface-variant'
                  }`}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
            
            {/* Show ALL status progression buttons */}
            <View className="space-y-2">
              {/* Accept Emergency - Show when no response exists or status is notified */}
              {(!currentResponse || responderStatus === 'notified') && (
                <TouchableOpacity
                  className="bg-green-500 py-3 rounded-lg"
                  onPress={() => handleStatusUpdate('accepted', 'Responder accepted the emergency')}
                >
                  <Text className="text-white text-center font-semibold">✅ Accept Emergency</Text>
                </TouchableOpacity>
              )}
              
              {/* Start Navigation - Show when accepted */}
              {responderStatus === 'accepted' && (
                <TouchableOpacity
                  className="bg-orange-500 py-3 rounded-lg"
                  onPress={() => handleStatusUpdate('en_route', 'Starting navigation to victim location')}
                >
                  <Text className="text-white text-center font-semibold">🚗 Start Navigation</Text>
                </TouchableOpacity>
              )}
              
              {/* Mark as Arrived - Show when en route */}
              {responderStatus === 'en_route' && (
                <TouchableOpacity
                  className="bg-purple-500 py-3 rounded-lg"
                  onPress={() => handleStatusUpdate('on_scene', 'Arrived at victim location')}
                >
                  <Text className="text-white text-center font-semibold">📍 Mark as Arrived</Text>
                </TouchableOpacity>
              )}
              
              {/* Complete Emergency - Show when on scene */}
              {responderStatus === 'on_scene' && (
                <TouchableOpacity
                  className="bg-green-500 py-3 rounded-lg"
                  onPress={() => handleStatusUpdate('completed', 'Emergency response completed successfully')}
                >
                  <Text className="text-white text-center font-semibold">✅ Complete Emergency</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Current Status Display */}
            {currentResponse && (
              <View className="mt-3 p-2 bg-primary/10 rounded-lg">
                <Text className="text-center text-on-surface font-medium">
                  Current Status: <Text className="font-bold">{responderStatus.replace('_', ' ').toUpperCase()}</Text>
                </Text>
                {currentResponse.notes && (
                  <Text className="text-center text-on-surface-variant text-sm mt-1">
                    Notes: {currentResponse.notes}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Location Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Location Details</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row items-start mb-3">
              <Text className="text-2xl mr-3">📍</Text>
              <View className="flex-1">
                <Text className="text-on-surface font-medium">
                  {emergency.initial_address || 'Location not specified'}
                </Text>
                <Text className="text-label text-on-surface-variant mt-1">
                  Coordinates: {formatCoordinate(emergency.initial_latitude)}, {formatCoordinate(emergency.initial_longitude)}
                </Text>
              </View>
            </View>
            
            {emergency.initial_latitude && emergency.initial_longitude && (
              <TouchableOpacity
                className="bg-primary py-3 rounded-lg mt-2"
                onPress={handleNavigateToLocation}
              >
                <Text className="text-white text-center font-semibold">Open in Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Victim Information */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Victim Information</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-on-surface font-medium">
                  {emergency.user_info?.full_name || 'Unknown User'}
                </Text>
                <Text className="text-label text-on-surface-variant">
                  {emergency.user_info?.phone || 'No phone'} • {emergency.user_info?.email || 'No email'}
                </Text>
              </View>
              {emergency.user_info?.phone && (
                <TouchableOpacity
                  className="bg-green-500 px-4 py-2 rounded-lg"
                  onPress={handleCallVictim}
                >
                  <Text className="text-white font-semibold">Call Victim</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        {emergency.emergency_contacts && emergency.emergency_contacts.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Emergency Contacts</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              {emergency.emergency_contacts.map((contact, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                  onPress={() => handleCallEmergencyContact(contact)}
                >
                  <View>
                    <Text className="text-on-surface font-medium">
                      {contact.name} {contact.is_primary && '⭐'}
                    </Text>
                    <Text className="text-label text-on-surface-variant">
                      {contact.relationship} • {contact.phone}
                    </Text>
                  </View>
                  <Text className="text-primary">📞</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Incident Details */}
        <View className="px-6 mb-6">
          <Text className="text-title text-on-surface mb-3">Incident Details</Text>
          <View className="bg-surface-variant rounded-xl p-4">
            <Text className="text-on-surface mb-2 font-medium">
              Emergency Type: {emergency.emergency_type || 'General Emergency'}
            </Text>
            <Text className="text-on-surface mb-4">
              {emergency.description || 'No additional details provided.'}
            </Text>
            <Text className="text-label text-on-surface-variant">
              Activation Method: {emergency.activation_method || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Media Captures */}
        {hasMedia && (
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Emergency Media</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              <Text className="text-on-surface mb-3">Evidence captured by victim:</Text>
              <View className="space-y-3">
                {emergency.media_captures.map((media) => (
                  <TouchableOpacity
                    key={media.id}
                    className="flex-row items-center p-3 bg-primary/10 rounded-lg"
                    onPress={() => handleViewMedia(media)}
                    disabled={loadingMedia[media.id]}
                  >
                    <Text className="text-2xl mr-3">
                      {media.media_type === 'photo' ? '📸' : 
                       media.media_type === 'audio' ? '🎵' : '🎥'}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-on-surface font-medium">
                        {media.media_type.toUpperCase()} 
                        {media.duration ? ` (${media.duration}s)` : ''}
                      </Text>
                      <Text className="text-label text-on-surface-variant text-sm">
                        {formatTimeElapsed(media.captured_at)} • 
                        {(media.file_size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </View>
                    {loadingMedia[media.id] ? (
                      <Text className="text-primary">Loading...</Text>
                    ) : (
                      <Text className="text-primary">View →</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Location Updates */}
        {emergency.location_updates && emergency.location_updates.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-title text-on-surface mb-3">Location Updates</Text>
            <View className="bg-surface-variant rounded-xl p-4">
              <Text className="text-on-surface mb-3">Victim's recent locations:</Text>
              {emergency.location_updates.slice(0, 5).map((update, index) => (
                <View key={update.id} className="flex-row justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <View>
                    <Text className="text-label text-on-surface-variant">
                      {formatCoordinate(update.latitude)}, {formatCoordinate(update.longitude)}
                    </Text>
                    {update.accuracy && (
                      <Text className="text-label text-on-surface-variant text-xs">
                        Accuracy: {update.accuracy}m
                      </Text>
                    )}
                  </View>
                  <Text className="text-label text-on-surface-variant text-xs">
                    {formatTimeElapsed(update.timestamp)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text className="text-title text-on-surface mb-3">Quick Actions</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-surface-variant py-4 rounded-xl items-center"
              onPress={() => Alert.alert("Request Backup", "This would request additional responders")}
            >
              <Text className="text-2xl mb-1">🆘</Text>
              <Text className="text-on-surface font-semibold">Request Backup</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-surface-variant py-4 rounded-xl items-center"
              onPress={() => router.push(`/(agent)/incident-report?alertId=${alertId}`)}
            >
              <Text className="text-2xl mb-1">📝</Text>
              <Text className="text-on-surface font-semibold">Incident Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Image Modal */}
      <Modal
        visible={mediaModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMediaModalVisible(false)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center p-4">
          <TouchableOpacity 
            className="absolute top-10 right-5 z-10 bg-black/50 rounded-full w-10 h-10 items-center justify-center"
            onPress={() => setMediaModalVisible(false)}
          >
            <Text className="text-white text-xl font-bold">✕</Text>
          </TouchableOpacity>
          
          {selectedMedia && (
            <View className="w-full max-w-full">
              {!imageError ? (
                <Image
                  source={{ uri: selectedMedia.url }}
                  className="w-full h-80 rounded-lg"
                  resizeMode="contain"
                  onError={() => {
                    console.error('Failed to load image:', selectedMedia.url);
                    setImageError(true);
                  }}
                  onLoad={() => console.log('Image loaded successfully:', selectedMedia.url)}
                />
              ) : (
                <View className="w-full h-80 bg-gray-800 rounded-lg items-center justify-center">
                  <Text className="text-white text-lg">❌ Failed to load image</Text>
                  <Text className="text-gray-400 text-sm mt-2 text-center">
                    URL: {selectedMedia.url}
                  </Text>
                </View>
              )}
              
              <View className="mt-4 bg-black/50 rounded-lg p-4">
                <Text className="text-white text-center text-lg font-semibold">
                  {selectedMedia.media_type.toUpperCase()}
                </Text>
                <Text className="text-gray-300 text-center mt-1">
                  Captured: {formatTimeElapsed(selectedMedia.captured_at)}
                </Text>
                <Text className="text-gray-300 text-center">
                  Size: {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB
                </Text>
                <Text className="text-gray-400 text-center text-xs mt-2">
                  {selectedMedia.url}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Response Time Indicator */}
      <View className="absolute top-4 right-4 bg-panic/90 px-3 py-2 rounded-full">
        <Text className="text-white text-sm">Response: {formatDuration(timeElapsed)}</Text>
      </View>
    </View>
  );
}