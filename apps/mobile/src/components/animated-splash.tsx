import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
  LinearGradient,
} from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { font } from '../theme';

/**
 * The MarketNest launch sequence, ported 1:1 from MarketNest-Splash.dc.html.
 *
 * The native splash (a transparent bridge over #030906) hands off to this the
 * moment JS is ready, so the animation builds up from a dark screen exactly as
 * the design does — nothing pops in pre-drawn.
 *
 * Choreography (absolute ms from mount), matching the design's phase schedule:
 *   0     background fades in; blobs, particles, scanlines, rings begin
 *   520   icon scales in and its three arcs self-draw (stroke-dashoffset),
 *         then the emerald orb pops
 *   1280  "MarketNest" rises, its letter-spacing tightening
 *   1840  the tagline fades up
 *   2360  loading dots pulse and the progress bar sweeps
 *   ~5200 the whole overlay fades out and reveals the app
 *
 * Reproduced faithfully: the self-drawing arcs, orb back-out pop, blob drift,
 * rising particles, expanding rings, pulsing halo, title reveal, dot cycle, and
 * progress sweep. The design's Gaussian blur-in on the icon/title has no cheap
 * RN equivalent, so it is expressed as an opacity ramp — the motion is intact.
 */

const A = '#3dcf7a';
const FINISH_AT = 5200;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedLine = Animated.createAnimatedComponent(Line);

/** Particle field from the design (x%, size, delay s, duration s, opacity). */
const PARTICLES = [
  { x: 6, s: 3.5, d: 0, dr: 7, op: 0.22 }, { x: 14, s: 2.5, d: 1.4, dr: 6, op: 0.15 },
  { x: 24, s: 4.5, d: 0.6, dr: 8, op: 0.18 }, { x: 33, s: 3, d: 2.1, dr: 5.5, op: 0.28 },
  { x: 42, s: 5.5, d: 0.3, dr: 7.5, op: 0.11 }, { x: 51, s: 2, d: 1.8, dr: 6, op: 0.26 },
  { x: 58, s: 3.5, d: 0.9, dr: 7, op: 0.2 }, { x: 67, s: 4, d: 2.4, dr: 6.5, op: 0.14 },
  { x: 76, s: 2.5, d: 0.4, dr: 5.5, op: 0.3 }, { x: 84, s: 4, d: 1.2, dr: 8, op: 0.16 },
  { x: 91, s: 3, d: 0.7, dr: 6, op: 0.22 }, { x: 96, s: 2, d: 2.8, dr: 7, op: 0.18 },
  { x: 11, s: 5, d: 1.6, dr: 7.5, op: 0.12 }, { x: 20, s: 3, d: 0.2, dr: 5, op: 0.26 },
  { x: 38, s: 2.5, d: 2.0, dr: 6.5, op: 0.19 }, { x: 47, s: 4, d: 0.5, dr: 7, op: 0.21 },
  { x: 63, s: 3.5, d: 1.3, dr: 6, op: 0.16 }, { x: 73, s: 2, d: 2.6, dr: 5.5, op: 0.24 },
  { x: 82, s: 4.5, d: 0.8, dr: 8, op: 0.13 }, { x: 89, s: 3, d: 1.5, dr: 6.5, op: 0.2 },
  { x: 3, s: 2.5, d: 3.1, dr: 6, op: 0.17 }, { x: 56, s: 3, d: 3.5, dr: 7.5, op: 0.19 },
];

/** Standard-ease bezier the design uses for the arc draw. */
const easeDraw = Easing.bezier(0.4, 0, 0.2, 1);
/** Back-out bezier for the orb pop. */
const easeBack = Easing.bezier(0.34, 1.56, 0.64, 1);

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();

  // Master overlay opacity — drives the final fade-out.
  const overlay = useSharedValue(1);

  // Background + ambient.
  const bg = useSharedValue(0);

  // Icon: container transform, three arc offsets, baseline, orb.
  const iconScale = useSharedValue(reducedMotion ? 1 : 0.04);
  const iconRot = useSharedValue(reducedMotion ? 0 : -28);
  const iconOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const arc1 = useSharedValue(reducedMotion ? 0 : 600);
  const arc2 = useSharedValue(reducedMotion ? 0 : 600);
  const arc3 = useSharedValue(reducedMotion ? 0 : 600);
  const baseline = useSharedValue(reducedMotion ? 0 : 220);
  const orb = useSharedValue(reducedMotion ? 1 : 0);

  // Text.
  const titleY = useSharedValue(reducedMotion ? 0 : 24);
  const titleSpacing = useSharedValue(reducedMotion ? -0.4 : 6);
  const titleOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const tagline = useSharedValue(reducedMotion ? 1 : 0);
  const taglineY = useSharedValue(reducedMotion ? 0 : 14);

  // Chrome.
  const dots = useSharedValue(0);
  const progress = useSharedValue(0);
  const progressOpacity = useSharedValue(1);

  // Looping ambient drivers (blobs, rings, halo). One shared value each.
  const blob1 = useSharedValue(0);
  const blob2 = useSharedValue(0);
  const blob3 = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      // Honour Reduce Motion: present the finished frame, hold briefly, dismiss.
      bg.value = withTiming(1, { duration: 300 });
      titleOpacity.value = 1;
      const t = setTimeout(onFinish, 1200);
      return () => clearTimeout(t);
    }

    // ── 0ms: background + ambient ────────────────────────────────────────────
    bg.value = withTiming(1, { duration: 550 });
    blob1.value = withRepeat(withTiming(1, { duration: 4800, easing: Easing.inOut(Easing.ease) }), -1, true);
    blob2.value = withDelay(800, withRepeat(withTiming(1, { duration: 5800, easing: Easing.inOut(Easing.ease) }), -1, true));
    blob3.value = withDelay(1400, withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.ease) }), -1, true));
    halo.value = withDelay(520, withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true));

    // Rings begin at ~280ms, each looping 2.4s, staggered like the design.
    ring1.value = withDelay(320, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false));
    ring2.value = withDelay(1130, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false));
    ring3.value = withDelay(1880, withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false));

    // ── 520ms: icon scales in, arcs draw, orb pops ───────────────────────────
    iconOpacity.value = withDelay(520, withTiming(1, { duration: 200 }));
    // scale .04 → 1.14 → .96 → 1.03 → 1, matching the design's iconIn keyframes.
    iconScale.value = withDelay(
      520,
      withSequence(
        withTiming(1.14, { duration: 470, easing: Easing.out(Easing.quad) }),
        withTiming(0.96, { duration: 230 }),
        withTiming(1.03, { duration: 130 }),
        withTiming(1, { duration: 120 }),
      ),
    );
    iconRot.value = withDelay(520, withTiming(0, { duration: 950, easing: Easing.out(Easing.cubic) }));
    // Arcs: outer .06s, mid .22s, inner .37s, baseline .48s (offsets from 520).
    arc1.value = withDelay(580, withTiming(0, { duration: 780, easing: easeDraw }));
    arc2.value = withDelay(740, withTiming(0, { duration: 650, easing: easeDraw }));
    arc3.value = withDelay(890, withTiming(0, { duration: 520, easing: easeDraw }));
    baseline.value = withDelay(1000, withTiming(0, { duration: 420, easing: Easing.ease }));
    orb.value = withDelay(1070, withTiming(1, { duration: 700, easing: easeBack }));

    // ── 1280ms: title reveal ─────────────────────────────────────────────────
    titleOpacity.value = withDelay(1280, withTiming(1, { duration: 850 }));
    titleY.value = withDelay(1280, withTiming(0, { duration: 850, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
    titleSpacing.value = withDelay(1280, withTiming(-0.4, { duration: 850, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));

    // ── 1840ms: tagline ──────────────────────────────────────────────────────
    tagline.value = withDelay(1840, withTiming(1, { duration: 650 }));
    taglineY.value = withDelay(1840, withTiming(0, { duration: 650 }));

    // ── 2360ms: loading dots + progress sweep ────────────────────────────────
    dots.value = withDelay(2360, withRepeat(withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.ease) }), -1, false));
    progress.value = withDelay(2360, withTiming(1, { duration: 3000, easing: Easing.out(Easing.ease) }));
    progressOpacity.value = withDelay(5200, withTiming(0, { duration: 300 }));

    // ── finish: fade the overlay and reveal the app ──────────────────────────
    overlay.value = withDelay(
      FINISH_AT,
      withTiming(0, { duration: 420, easing: Easing.inOut(Easing.ease) }, (done) => {
        if (done) runOnJS(onFinish)();
      }),
    );

    return () => {
      [
        overlay, bg, iconScale, iconRot, iconOpacity, arc1, arc2, arc3, baseline, orb,
        titleY, titleSpacing, titleOpacity, tagline, taglineY, dots, progress, progressOpacity,
        blob1, blob2, blob3, ring1, ring2, ring3, halo,
      ].forEach(cancelAnimation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // ── Derived styles ──────────────────────────────────────────────────────────
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bg.value }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }, { rotate: `${iconRot.value}deg` }],
  }));
  const arc1Props = useAnimatedProps(() => ({ strokeDashoffset: arc1.value }));
  const arc2Props = useAnimatedProps(() => ({ strokeDashoffset: arc2.value }));
  const arc3Props = useAnimatedProps(() => ({ strokeDashoffset: arc3.value }));
  const baselineProps = useAnimatedProps(() => ({ strokeDashoffset: baseline.value }));
  const orbProps = useAnimatedProps(() => ({ opacity: orb.value, scale: orb.value }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    letterSpacing: titleSpacing.value,
    transform: [{ translateY: titleY.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: taglineY.value }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + halo.value * 0.38,
    transform: [{ scale: 1 + halo.value * 0.35 }],
  }));

  // Blobs drift + breathe (bp1/bp2/bp3): a there-and-back sine via the 0→1→0 driver.
  const blob1Style = useAnimatedStyle(() => ({
    opacity: 0.55 + blob1.value * 0.35,
    transform: [{ scale: 1 + blob1.value * 0.2 }, { translateX: -blob1.value * 10 }, { translateY: -blob1.value * 16 }],
  }));
  const blob2Style = useAnimatedStyle(() => ({
    opacity: 0.38 + blob2.value * 0.32,
    transform: [{ scale: 1 + blob2.value * 0.25 }, { translateX: blob2.value * 14 }, { translateY: blob2.value * 10 }],
  }));
  const blob3Style = useAnimatedStyle(() => ({
    opacity: 0.28 + blob3.value * 0.27,
    transform: [{ scale: 1.05 - blob3.value * 0.15 }, { translateX: -blob3.value * 8 }, { translateY: blob3.value * 12 }],
  }));

  // Rings: each expands scale 0→8 while fading. Written out rather than via a
  // helper so every useAnimatedStyle call is unconditional and top-level.
  const ring1Style = useAnimatedStyle(() => ({ opacity: (1 - ring1.value) * 0.75, transform: [{ scale: ring1.value * 8 }] }));
  const ring2Style = useAnimatedStyle(() => ({ opacity: (1 - ring2.value) * 0.75, transform: [{ scale: ring2.value * 8 }] }));
  const ring3Style = useAnimatedStyle(() => ({ opacity: (1 - ring3.value) * 0.75, transform: [{ scale: ring3.value * 8 }] }));

  const progressStyle = useAnimatedStyle(() => ({
    width: progress.value * width,
    opacity: progressOpacity.value,
  }));

  // Each dot peaks at a different point of the shared 0→1 cycle (design dp1/2/3).
  const dotLit = (phase: number) => {
    'worklet';
    const p = (dots.value + phase) % 1;
    return p < 0.25 ? p / 0.25 : p < 0.5 ? 1 - (p - 0.25) / 0.25 : 0;
  };
  const dot1Style = useAnimatedStyle(() => {
    const lit = dotLit(0);
    return { opacity: 0.22 + lit * 0.78, transform: [{ scale: 0.65 + lit * 0.53 }] };
  });
  const dot2Style = useAnimatedStyle(() => {
    const lit = dotLit(-0.2);
    return { opacity: 0.22 + lit * 0.78, transform: [{ scale: 0.65 + lit * 0.53 }] };
  });
  const dot3Style = useAnimatedStyle(() => {
    const lit = dotLit(-0.4);
    return { opacity: 0.22 + lit * 0.78, transform: [{ scale: 0.65 + lit * 0.53 }] };
  });

  const iconSize = Math.min(width * 0.36, 150);
  const centerTop = height * 0.44;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, overlayStyle]} pointerEvents="none">
      {/* Background radial + scanline texture */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="bgGrad" cx="50%" cy="44%" rx="90%" ry="80%">
              <Stop offset="0%" stopColor="#071a0c" />
              <Stop offset="68%" stopColor="#030906" />
              <Stop offset="100%" stopColor="#030906" />
            </RadialGradient>
            {/* Faint horizontal scanlines for depth (design's 3% overlay),
                tiled by the engine rather than emitting a node per line. */}
            <Pattern id="scan" width={3} height={3} patternUnits="userSpaceOnUse">
              <Line x1={0} y1={0} x2={3} y2={0} stroke="#000000" strokeOpacity={0.03} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect width={width} height={height} fill="url(#bgGrad)" />
          <Rect width={width} height={height} fill="url(#scan)" />
        </Svg>
      </Animated.View>

      {/* Drifting blobs */}
      <Animated.View style={[styles.blob, { top: height * 0.15, left: width * 0.08 }, blob1Style]}>
        <SoftBlob size={210} opacity={0.2} />
      </Animated.View>
      <Animated.View style={[styles.blob, { top: height * 0.48, right: width * 0.05 }, blob2Style]}>
        <SoftBlob size={170} opacity={0.13} />
      </Animated.View>
      <Animated.View style={[styles.blob, { bottom: height * 0.12, left: width * 0.2 }, blob3Style]}>
        <SoftBlob size={130} opacity={0.09} />
      </Animated.View>

      {/* Rising particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} particle={p} width={width} height={height} />
      ))}

      {/* Expanding rings */}
      <View style={[styles.ringWrap, { top: centerTop }]} pointerEvents="none">
        <Animated.View style={[styles.ring, ring1Style]} />
        <Animated.View style={[styles.ring, ring2Style]} />
        <Animated.View style={[styles.ring, ring3Style]} />
      </View>

      {/* Center content */}
      <View style={styles.center} pointerEvents="none">
        {/* Pulsing halo behind the icon */}
        <Animated.View style={[styles.halo, haloStyle]}>
          <SoftBlob size={240} opacity={0.3} />
        </Animated.View>

        {/* The Nest Mark, self-drawing */}
        <Animated.View style={[styles.icon, iconStyle]}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 160 160">
            <Defs>
              <RadialGradient id="sgl" cx="50%" cy="46%">
                <Stop offset="0%" stopColor={A} stopOpacity={0.52} />
                <Stop offset="70%" stopColor={A} stopOpacity={0.12} />
                <Stop offset="100%" stopColor={A} stopOpacity={0} />
              </RadialGradient>
              <LinearGradient id="smk" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#88f7bc" />
                <Stop offset="100%" stopColor="#1eb85c" />
              </LinearGradient>
              <RadialGradient id="sob" cx="34%" cy="30%">
                <Stop offset="0%" stopColor="#e0fff0" />
                <Stop offset="45%" stopColor={A} />
                <Stop offset="100%" stopColor="#165e30" />
              </RadialGradient>
            </Defs>
            <Ellipse cx={80} cy={78} rx={68} ry={60} fill="url(#sgl)" />
            <AnimatedPath
              d="M20,104 C20,34 140,34 140,104"
              stroke="url(#smk)"
              strokeWidth={8.5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={600}
              animatedProps={arc1Props}
            />
            <AnimatedPath
              d="M38,104 C38,53 122,53 122,104"
              stroke="url(#smk)"
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
              opacity={0.72}
              strokeDasharray={600}
              animatedProps={arc2Props}
            />
            <AnimatedPath
              d="M57,104 C57,69 103,69 103,104"
              stroke="url(#smk)"
              strokeWidth={5.5}
              fill="none"
              strokeLinecap="round"
              opacity={0.48}
              strokeDasharray={600}
              animatedProps={arc3Props}
            />
            <AnimatedLine
              x1={25}
              y1={109}
              x2={135}
              y2={109}
              stroke="url(#smk)"
              strokeWidth={4.5}
              strokeLinecap="round"
              opacity={0.26}
              strokeDasharray={220}
              animatedProps={baselineProps}
            />
            <AnimatedG originX={80} originY={72} animatedProps={orbProps}>
              <Circle cx={80} cy={72} r={10} fill="url(#sob)" />
              <Circle cx={76.5} cy={68.5} r={3.8} fill="#ffffff" opacity={0.44} />
            </AnimatedG>
          </Svg>
        </Animated.View>

        <Animated.Text style={[styles.title, titleStyle]} allowFontScaling={false}>
          MarketNest
        </Animated.Text>
        <Animated.Text style={[styles.tagline, taglineStyle]} allowFontScaling={false}>
          DISCOVER · BUY · THRIVE
        </Animated.Text>
      </View>

      {/* Loading dots */}
      <View style={styles.dots} pointerEvents="none">
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack} pointerEvents="none">
        <Animated.View style={progressStyle}>
          <Svg width={width} height={2}>
            <Defs>
              <LinearGradient id="prg" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor={A} stopOpacity={0} />
                <Stop offset="55%" stopColor={A} />
                <Stop offset="70%" stopColor="#ffffff" stopOpacity={0.9} />
                <Stop offset="85%" stopColor={A} />
                <Stop offset="100%" stopColor={A} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width={width} height={2} fill="url(#prg)" />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/** A soft green radial disc — the design's blurred blobs and halo, blur-free. */
function SoftBlob({ size, opacity }: { size: number; opacity: number }) {
  const id = `blob${size}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%">
          <Stop offset="0%" stopColor={A} stopOpacity={opacity} />
          <Stop offset="70%" stopColor={A} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** One rising particle (design `fu`): drifts up, shrinking and fading. */
function Particle({
  particle,
  width,
  height,
}: {
  particle: (typeof PARTICLES)[number];
  width: number;
  height: number;
}) {
  const rise = height * 0.55;
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      particle.d * 1000,
      withRepeat(withTiming(1, { duration: particle.dr * 1000, easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    // Envelope 0 → 1 (12%) → 1 (85%) → 0, matching the design's opacity ramp.
    const env = t < 0.12 ? t / 0.12 : t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    return {
      opacity: env,
      transform: [{ translateY: -t * rise }, { scale: 1 - t * 0.88 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: (particle.x / 100) * width,
          bottom: height * 0.06,
          width: particle.s,
          height: particle.s,
          borderRadius: particle.s / 2,
          backgroundColor: `rgba(61,207,122,${particle.op})`,
          shadowColor: A,
          shadowOpacity: particle.op * 0.6,
          shadowRadius: particle.s * 2.5,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#030906', alignItems: 'center', justifyContent: 'center' },
  blob: { position: 'absolute' },
  particle: { position: 'absolute' },
  ringWrap: { position: 'absolute', left: '50%', alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 100,
    height: 100,
    marginLeft: -50,
    marginTop: -50,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(61,207,122,0.75)',
  },
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', top: -56 },
  icon: { marginBottom: 30 },
  title: {
    fontFamily: font.display,
    fontSize: 42,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(61,207,122,0.48)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 32,
  },
  tagline: {
    fontFamily: font.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 2.3,
    textAlign: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: A },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(61,207,122,0.07)',
    overflow: 'hidden',
  },
});
