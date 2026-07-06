import { Text, View } from 'react-native';
import Svg, { G, Path, Rect } from 'react-native-svg';

export const PIE_COLORS = ['#4B7BE5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'];

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const [x1, y1] = polar(cx, cy, rOuter, end);
  const [x2, y2] = polar(cx, cy, rOuter, start);
  const [x3, y3] = polar(cx, cy, rInner, start);
  const [x4, y4] = polar(cx, cy, rInner, end);
  const large = end - start <= 180 ? 0 : 1;
  return `M${x1} ${y1} A${rOuter} ${rOuter} 0 ${large} 0 ${x2} ${y2} L${x3} ${y3} A${rInner} ${rInner} 0 ${large} 1 ${x4} ${y4} Z`;
}

/** Donut chart with a centered total, plus a legend. */
export function Donut({
  slices,
  format,
  size = 120,
}: {
  slices: { name: string; value: number }[];
  format: (n: number) => string;
  size?: number;
}) {
  const data = slices.filter((s) => s.value > 0);
  const total = data.reduce((s, x) => s + x.value, 0);
  const rOuter = size / 2;
  const rInner = size / 2 - 20;

  let angle = 0;
  const paths = data.map((s, i) => {
    const sweep = (s.value / total) * 360;
    const p = arcPath(rOuter, rOuter, rOuter, rInner, angle, angle + Math.max(0.5, sweep - 2));
    angle += sweep;
    return { p, color: PIE_COLORS[i % PIE_COLORS.length] };
  });

  return (
    <View className="flex-row items-center gap-4">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G>
            {paths.map((p, i) => (
              <Path key={i} d={p.p} fill={p.color} />
            ))}
          </G>
        </Svg>
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <Text className="text-[9px] text-slate-400 uppercase">Total</Text>
          <Text className="text-xs font-black text-slate-800">{format(total)}</Text>
        </View>
      </View>
      <View className="flex-1">
        {data.slice(0, 6).map((s, i) => (
          <View key={s.name} className="flex-row items-center gap-2 mb-1.5">
            <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            <Text className="text-xs text-slate-600 flex-1" numberOfLines={1}>
              {s.name}
            </Text>
            <Text className="text-xs font-semibold text-slate-800">{format(s.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Simple vertical bar chart for the 5-month trend. */
export function BarChart({
  data,
  color = '#4B7BE5',
  format,
  height = 150,
}: {
  data: { label: string; value: number }[];
  color?: string;
  format: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const chartH = height - 34;
  const barW = 34;
  const gap = 18;
  const width = data.length * (barW + gap);

  return (
    <View>
      <View style={{ height }}>
        <Svg width={width} height={height}>
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * chartH);
            const x = i * (barW + gap) + gap / 2;
            const y = chartH - h;
            return <Rect key={i} x={x} y={y} width={barW} height={h} rx={6} fill={color} />;
          })}
        </Svg>
        {/* value + month labels overlaid */}
        <View style={{ position: 'absolute', top: 0, left: 0, flexDirection: 'row', width }}>
          {data.map((d, i) => {
            const h = Math.max(2, (d.value / max) * chartH);
            return (
              <View key={i} style={{ width: barW + gap, alignItems: 'center' }}>
                <View style={{ height: chartH - h - 14, justifyContent: 'flex-end' }} />
                <Text className="text-[9px] font-semibold text-slate-500">{d.value > 0 ? format(d.value) : ''}</Text>
                <View style={{ flex: 1 }} />
                <Text className="text-[10px] text-slate-400" style={{ position: 'absolute', bottom: 0 }}>
                  {d.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}
