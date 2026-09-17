import { memo, useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AlternativeDonnees from '../AlternativeDonnees/AlternativeDonnees';
import { AXE, COULEURS_SERIES, GRILLE, TOOLTIP_STYLE, TRAITS_SERIES } from '../../constants/charts';
import { formatPrix, nomVehicule } from '../../utils/format';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import styles from './GraphiqueEvolution.module.css';

/**
 * Coût cumulé année par année, une courbe par véhicule.
 * Répond directement à « lequel me coûte le plus cher au fil du temps ? »,
 * y compris quand les courbes se croisent (électrique vs thermique).
 */
function GraphiqueEvolution({ resultats, region }) {
  const etroit = useMediaQuery('(max-width: 640px)');

  const series = useMemo(() => resultats.filter((r) => r.evolution.length > 0), [resultats]);

  const donnees = useMemo(() => {
    const annees = new Set();
    series.forEach((r) => r.evolution.forEach((p) => annees.add(p.annee)));

    return [...annees]
      .sort((a, b) => a - b)
      .map((annee) => {
        const ligne = { annee };
        series.forEach((r) => {
          const point = r.evolution.find((p) => p.annee === annee);
          ligne[r.vehiculeId] = point ? point.coutCumule : null;
        });
        return ligne;
      });
  }, [series]);

  if (series.length === 0) {
    return (
      <p className={styles.indisponible}>
        L’évolution annuelle n’a pas été fournie pour ces véhicules. Les coûts totaux restent
        consultables dans le tableau comparatif.
      </p>
    );
  }

  return (
    <div className={styles.bloc}>
      {/* Décoratif pour les lecteurs d'écran : le tableau ci-dessous porte la donnée. */}
      <div style={{ width: '100%', height: etroit ? 260 : 330 }} aria-hidden="true">
        <ResponsiveContainer>
          <LineChart
            data={donnees}
            margin={{ top: 8, right: 14, bottom: 4, left: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid stroke={GRILLE} vertical={false} />
            <XAxis
              dataKey="annee"
              stroke={AXE}
              tick={{ fill: AXE, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: GRILLE }}
              tickFormatter={(v) => `An ${v}`}
            />
            <YAxis
              stroke={AXE}
              tick={{ fill: AXE, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={etroit ? 54 : 78}
              tickFormatter={(v) =>
                etroit ? `${Math.round(v / 1000)}k` : formatPrix(v, region)
              }
            />
            <Tooltip
              cursor={{ stroke: 'rgba(201,162,39,0.3)', strokeWidth: 1 }}
              contentStyle={TOOLTIP_STYLE}
              itemStyle={{ color: '#F5F5F5', padding: '1px 0' }}
              labelStyle={{ color: '#A7A7A7', marginBottom: 6 }}
              formatter={(valeur, nom) => [formatPrix(valeur, region), nom]}
              labelFormatter={(v) => `Après ${v} an${v > 1 ? 's' : ''}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(valeur) => <span style={{ color: AXE }}>{valeur}</span>}
              iconType="plainline"
              iconSize={14}
              itemSorter={() => 0}
            />
            {series.map((r, i) => (
              <Line
                key={r.vehiculeId}
                type="monotone"
                dataKey={r.vehiculeId}
                name={nomVehicule(r.vehicule)}
                stroke={COULEURS_SERIES[i % COULEURS_SERIES.length]}
                strokeWidth={i === 0 ? 2.4 : 1.8}
                strokeDasharray={TRAITS_SERIES[i % TRAITS_SERIES.length]}
                dot={{ r: 2.5, strokeWidth: 0, fill: COULEURS_SERIES[i % COULEURS_SERIES.length] }}
                activeDot={{ r: 4.5, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <AlternativeDonnees
        titre="Afficher les données du graphique"
        colonnes={['Véhicule', ...donnees.map((d) => `Année ${d.annee}`)]}
        lignes={series.map((r) => [
          nomVehicule(r.vehicule),
          ...donnees.map((d) =>
            d[r.vehiculeId] === null ? '—' : formatPrix(d[r.vehiculeId], region),
          ),
        ])}
      />
    </div>
  );
}

export default memo(GraphiqueEvolution);
