import { memo, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AlternativeDonnees from '../AlternativeDonnees/AlternativeDonnees';
import { AXE, COULEURS_POSTES, GRILLE, TOOLTIP_STYLE } from '../../constants/charts';
import { POSTES_COUT } from '../../constants/simulation';
import { formatPrix, formatPourcentage, nomCourt, nomVehicule } from '../../utils/format';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import styles from './GraphiqueRepartition.module.css';

/**
 * Répartition des coûts, une barre empilée par véhicule.
 * Un seul graphique pour répondre à deux questions : « où part l'argent ? »
 * et « en quoi les véhicules diffèrent-ils ? ».
 */
function GraphiqueRepartition({ resultats, region }) {
  const etroit = useMediaQuery('(max-width: 640px)');

  const avecDetail = useMemo(() => resultats.filter((r) => r.detail !== null), [resultats]);
  const sansDetail = resultats.filter((r) => r.detail === null);

  const donnees = useMemo(
    () =>
      avecDetail.map((r) => ({
        id: r.vehiculeId,
        // Sur petit écran, la marque est sacrifiée : le modèle suffit à
        // identifier la barre et l'axe reste lisible sur une seule ligne.
        nom: etroit
          ? nomCourt({ modele: r.vehicule.modele }, 14)
          : nomCourt(r.vehicule, 22),
        nomComplet: nomVehicule(r.vehicule),
        total: r.coutTotal,
        ...r.detail,
      })),
    [avecDetail, etroit],
  );

  if (avecDetail.length === 0) {
    return (
      <p className={styles.indisponible}>
        Le détail par poste n’a pas été fourni pour ces véhicules. Les coûts totaux restent
        consultables dans le tableau comparatif.
      </p>
    );
  }

  const hauteur = Math.max(200, donnees.length * (etroit ? 62 : 74) + 70);

  return (
    <div className={styles.bloc}>
      {/* Le graphique est décoratif pour les technologies d'assistance : la
          donnée exacte est fournie par le tableau ci-dessous, plus utilisable
          qu'une navigation au clavier dans un SVG. */}
      <div style={{ width: '100%', height: hauteur }} aria-hidden="true">
        <ResponsiveContainer>
          <BarChart
            data={donnees}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
            barCategoryGap={etroit ? '28%' : '34%'}
            accessibilityLayer={false}
          >
            <CartesianGrid horizontal={false} stroke={GRILLE} />
            <XAxis
              type="number"
              tickFormatter={(v) => (etroit ? `${Math.round(v / 1000)}k` : formatPrix(v, region))}
              stroke={AXE}
              tick={{ fill: AXE, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRILLE }}
            />
            <YAxis
              type="category"
              dataKey="nom"
              width={etroit ? 88 : 176}
              stroke={AXE}
              tick={{ fill: '#F5F5F5', fontSize: etroit ? 11 : 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.035)' }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: '#F5F5F5', padding: '1px 0' }}
              labelStyle={{ color: '#A7A7A7', marginBottom: 6 }}
              formatter={(valeur, nomSerie) => [formatPrix(valeur, region), nomSerie]}
              labelFormatter={(_, charge) => charge?.[0]?.payload?.nomComplet ?? ''}
            />
            {/* Légende explicite : conserve l'ordre d'empilement des postes. */}
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              formatter={(valeur) => <span style={{ color: AXE }}>{valeur}</span>}
              iconType="square"
              iconSize={9}
              itemSorter={() => 0}
              payload={POSTES_COUT.map((poste) => ({
                value: poste.label,
                type: 'square',
                id: poste.key,
                color: COULEURS_POSTES[poste.key],
              }))}
            />
            {POSTES_COUT.map((poste, index) => (
              <Bar
                key={poste.key}
                dataKey={poste.key}
                name={poste.label}
                stackId="couts"
                fill={COULEURS_POSTES[poste.key]}
                radius={
                  index === POSTES_COUT.length - 1 ? [0, 2, 2, 0] : index === 0 ? [2, 0, 0, 2] : 0
                }
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {sansDetail.length > 0 ? (
        <p className={styles.note}>
          Détail indisponible pour : {sansDetail.map((r) => nomVehicule(r.vehicule)).join(', ')}.
        </p>
      ) : null}

      <AlternativeDonnees
        titre="Afficher les données du graphique"
        colonnes={['Véhicule', ...POSTES_COUT.map((p) => p.label), 'Part du carburant']}
        lignes={donnees.map((d) => [
          d.nomComplet,
          ...POSTES_COUT.map((p) => formatPrix(d[p.key], region)),
          d.total > 0 ? formatPourcentage(d.carburant / d.total) : '—',
        ])}
      />
    </div>
  );
}

/* Les résultats ne changent qu'après une simulation : inutile de redessiner
   le graphique à chaque frappe dans le formulaire. */
export default memo(GraphiqueRepartition);
