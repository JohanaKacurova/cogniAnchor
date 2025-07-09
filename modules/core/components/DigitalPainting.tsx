import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Dimensions, TouchableOpacity, Text } from 'react-native';
import paintingConfig from '../../../config/digital-painting.json';

const COLORS = paintingConfig.colors;
const CANVAS_WIDTH = Dimensions.get('window').width - paintingConfig.canvasWidthOffset;
const CANVAS_HEIGHT = paintingConfig.canvasHeight;

export default function DigitalPainting({ onClose }: { onClose?: () => void }) {
  const [lines, setLines] = useState<{ color: string; points: { x: number; y: number }[] }[]>([]);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [drawing, setDrawing] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setDrawing(true);
        const { locationX, locationY } = evt.nativeEvent;
        setLines((prev) => [...prev, { color: currentColor, points: [{ x: locationX, y: locationY }] }]);
      },
      onPanResponderMove: (evt) => {
        if (!drawing) return;
        const { locationX, locationY } = evt.nativeEvent;
        setLines((prev) => {
          const newLines = [...prev];
          newLines[newLines.length - 1].points.push({ x: locationX, y: locationY });
          return newLines;
        });
      },
      onPanResponderRelease: () => setDrawing(false),
      onPanResponderTerminate: () => setDrawing(false),
    })
  ).current;

  const handleClear = () => setLines([]);
  const handleSave = () => alert('Saved! (placeholder)');
  const handleShare = () => alert('Shared! (placeholder)');

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Digital Painting</Text>
        <View style={styles.colorRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorButton, { backgroundColor: color, borderWidth: currentColor === color ? 3 : 1 }]}
              onPress={() => setCurrentColor(color)}
              accessibilityLabel={`Select color ${color}`}
              accessibilityRole="button"
            />
          ))}
          <TouchableOpacity style={styles.clearButton} onPress={handleClear} accessibilityLabel="Clear Canvas" accessibilityRole="button">
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.canvas} {...panResponder.panHandlers}>
          {/* SVG or Canvas drawing */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {lines.map((line, i) => (
              <View key={i} style={StyleSheet.absoluteFill} pointerEvents="none">
                {line.points.length > 1 && (
                  <SvgLine points={line.points} color={line.color} />
                )}
              </View>
            ))}
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} accessibilityLabel="Save Drawing" accessibilityRole="button">
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} accessibilityLabel="Share Drawing" accessibilityRole="button">
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityLabel="Close Painting" accessibilityRole="button">
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// Simple SVG polyline renderer for React Native
function SvgLine({ points, color }: { points: { x: number; y: number }[]; color: string }) {
  // Use react-native-svg if available, else fallback to View lines
  // For now, just render a series of small Views between points
  return (
    <>
      {points.slice(1).map((pt, i) => {
        const prev = points[i];
        if (!prev) return null;
        const dx = pt.x - prev.x;
        const dy = pt.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y,
              width: length,
              height: 3,
              backgroundColor: color,
              borderRadius: 2,
              transform: [
                { rotateZ: `${angle}deg` },
              ],
            }}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    width: CANVAS_WIDTH + 24,
    maxWidth: '98%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 4,
    borderColor: '#888',
  },
  clearButton: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
  },
  clearText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 16,
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#f7f7f7',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#eee',
    marginBottom: 18,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    elevation: 2,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  shareButton: {
    backgroundColor: '#2196F3',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    elevation: 2,
  },
  shareText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#eee',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    elevation: 2,
  },
  closeText: {
    color: '#888',
    fontWeight: '700',
    fontSize: 16,
  },
}); 