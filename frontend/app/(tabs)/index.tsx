import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Button, Card, Input } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function DesignSystemPreview() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Design System</Text>
      <Text style={styles.pageSubtitle}>MyFoodie · Preview</Text>

      {/* BOTONES */}
      <Section title="Button">
        <Button label="Primary" onPress={() => {}} />
        <Button label="Secondary" variant="secondary" onPress={() => {}} />
        <Button label="Ghost" variant="ghost" onPress={() => {}} />
        <Button label="Loading..." loading onPress={() => {}} />
        <Button label="Disabled" disabled onPress={() => {}} />
        <Button label="Full width" fullWidth onPress={() => {}} />
      </Section>

      {/* BADGES */}
      <Section title="Badge">
        <Row>
          <Badge label="Vegetariano" />
          <Badge label="Rápido" variant="secondary" />
          <Badge label="Sin gluten" variant="neutral" />
          <Badge label="Fácil" />
        </Row>
      </Section>

      {/* INPUTS */}
      <Section title="Input">
        <Input label="Email" placeholder="hola@myfoodie.app" keyboardType="email-address" />
        <Input label="Contraseña" placeholder="••••••••" secureTextEntry />
        <Input
          label="Con error"
          placeholder="Nombre de usuario"
          defaultValue="al"
          error="Mínimo 4 caracteres"
        />
      </Section>

      {/* CARDS */}
      <Section title="Card">
        <Card>
          <Text style={styles.cardTitle}>Pasta carbonara</Text>
          <Text style={styles.cardBody}>20 min · Fácil · 4 personas</Text>
          <Row style={{ marginTop: spacing.md }}>
            <Badge label="Italiana" />
            <Badge label="Rápido" variant="secondary" />
          </Row>
        </Card>
        <Card padding="xl">
          <Text style={styles.cardTitle}>Card con más padding</Text>
          <Text style={styles.cardBody}>Usa padding="xl" para cards más espaciosas.</Text>
        </Card>
      </Section>

      {/* COLORES */}
      <Section title="Colores">
        <Row style={{ flexWrap: 'wrap' }}>
          <ColorChip color={colors.primary} label="Primary" />
          <ColorChip color={colors.primaryDark} label="Primary Dark" />
          <ColorChip color={colors.secondary} label="Secondary" />
          <ColorChip color={colors.secondaryLight} label="Secondary Light" />
          <ColorChip color={colors.grayLight} label="Gray Light" border />
          <ColorChip color={colors.gray} label="Gray" border />
          <ColorChip color={colors.grayMid} label="Gray Mid" />
          <ColorChip color={colors.grayDark} label="Gray Dark" />
        </Row>
      </Section>

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function Row({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

function ColorChip({ color, label, border }: { color: string; label: string; border?: boolean }) {
  return (
    <View style={styles.colorChip}>
      <View style={[styles.colorBox, { backgroundColor: color }, border && styles.colorBorder]} />
      <Text style={styles.colorLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  pageTitle: {
    ...typography.display,
    color: colors.text.primary,
  },
  pageSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
  },

  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.primary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    gap: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },

  cardTitle: {
    ...typography.heading3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  cardBody: {
    ...typography.body,
    color: colors.text.secondary,
  },

  colorChip: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 72,
  },
  colorBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  colorBorder: {
    borderWidth: 1,
    borderColor: colors.gray,
  },
  colorLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
