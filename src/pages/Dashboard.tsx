import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Spiele, Spielzuege, Spielergebnisse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusCircle, TrendingUp, Users, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6'];

interface GameStats {
  totalGames: number;
  totalMoves: number;
  totalResults: number;
  activeGames: number;
  xWins: number;
  oWins: number;
  draws: number;
}

interface ActiveGameDisplay {
  game: Spiele;
  movesCount: number;
  lastMove?: Spielzuege;
  hasResult: boolean;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    totalMoves: 0,
    totalResults: 0,
    activeGames: 0,
    xWins: 0,
    oWins: 0,
    draws: 0,
  });
  const [activeGames, setActiveGames] = useState<ActiveGameDisplay[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    spieler_x_vorname: '',
    spieler_x_nachname: '',
    spieler_o_vorname: '',
    spieler_o_nachname: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [spiele, spielzuege, ergebnisse] = await Promise.all([
        LivingAppsService.getSpiele(),
        LivingAppsService.getSpielzuege(),
        LivingAppsService.getSpielergebnisse(),
      ]);

      // Calculate stats
      const gameIds = new Set(spiele.map((s) => s.record_id));
      const gameIdsWithResults = new Set(
        ergebnisse.map((e) => extractRecordId(e.fields.spiel)).filter(Boolean)
      );

      const xWins = ergebnisse.filter((e) => e.fields.ergebnis_typ === 'x_gewinnt').length;
      const oWins = ergebnisse.filter((e) => e.fields.ergebnis_typ === 'o_gewinnt').length;
      const draws = ergebnisse.filter((e) => e.fields.ergebnis_typ === 'unentschieden').length;

      setStats({
        totalGames: spiele.length,
        totalMoves: spielzuege.length,
        totalResults: ergebnisse.length,
        activeGames: gameIds.size - gameIdsWithResults.size,
        xWins,
        oWins,
        draws,
      });

      // Build active games list
      const activeGamesList: ActiveGameDisplay[] = [];
      spiele.forEach((game) => {
        const hasResult = gameIdsWithResults.has(game.record_id);
        if (hasResult) return; // Skip games that are finished

        const gameMoves = spielzuege.filter((move) => {
          const spielId = extractRecordId(move.fields.spiel);
          return spielId === game.record_id;
        });

        const sortedMoves = gameMoves.sort((a, b) => {
          const zugA = a.fields.zugnummer || 0;
          const zugB = b.fields.zugnummer || 0;
          return zugB - zugA;
        });

        activeGamesList.push({
          game,
          movesCount: gameMoves.length,
          lastMove: sortedMoves[0],
          hasResult,
        });
      });

      // Sort by startzeit (newest first)
      activeGamesList.sort((a, b) => {
        const timeA = a.game.fields.startzeit || a.game.createdat;
        const timeB = b.game.fields.startzeit || b.game.createdat;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setActiveGames(activeGamesList);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create game entry
      const now = new Date();
      const startzeit = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM

      await LivingAppsService.createSpieleEntry({
        spieler_x_vorname: formData.spieler_x_vorname,
        spieler_x_nachname: formData.spieler_x_nachname,
        spieler_o_vorname: formData.spieler_o_vorname,
        spieler_o_nachname: formData.spieler_o_nachname,
        startzeit,
        spielfeld_status: '', // Empty board initially
      });

      // Reset form and close dialog
      setFormData({
        spieler_x_vorname: '',
        spieler_x_nachname: '',
        spieler_o_vorname: '',
        spieler_o_nachname: '',
      });
      setDialogOpen(false);

      // Reload data
      await fetchData();
    } catch (err) {
      console.error('Error creating game:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Spiels');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare chart data
  const chartData = [
    { name: 'Spieler X gewinnt', value: stats.xWins, color: COLORS[0] },
    { name: 'Unentschieden', value: stats.draws, color: COLORS[1] },
    { name: 'Spieler O gewinnt', value: stats.oWins, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tic Tac Toe Dashboard</h1>
            <p className="text-muted-foreground">Verwalte deine Spiele und Statistiken</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <PlusCircle className="mr-2 h-5 w-5" />
                Neues Spiel starten
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Neues Spiel starten</DialogTitle>
                <DialogDescription>
                  Gib die Namen der beiden Spieler ein, um ein neues Tic Tac Toe Spiel zu starten.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Spieler X</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="x_vorname">Vorname</Label>
                        <Input
                          id="x_vorname"
                          value={formData.spieler_x_vorname}
                          onChange={(e) =>
                            setFormData({ ...formData, spieler_x_vorname: e.target.value })
                          }
                          placeholder="z.B. Max"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="x_nachname">Nachname</Label>
                        <Input
                          id="x_nachname"
                          value={formData.spieler_x_nachname}
                          onChange={(e) =>
                            setFormData({ ...formData, spieler_x_nachname: e.target.value })
                          }
                          placeholder="z.B. Mustermann"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Spieler O</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="o_vorname">Vorname</Label>
                        <Input
                          id="o_vorname"
                          value={formData.spieler_o_vorname}
                          onChange={(e) =>
                            setFormData({ ...formData, spieler_o_vorname: e.target.value })
                          }
                          placeholder="z.B. Anna"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="o_nachname">Nachname</Label>
                        <Input
                          id="o_nachname"
                          value={formData.spieler_o_nachname}
                          onChange={(e) =>
                            setFormData({ ...formData, spieler_o_nachname: e.target.value })
                          }
                          placeholder="z.B. Beispiel"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Erstelle...
                      </>
                    ) : (
                      'Spiel starten'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Spiele</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeGames}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalGames} Spiele insgesamt
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gespielte Züge</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMoves}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalMoves > 0 && stats.totalGames > 0
                  ? `Ø ${(stats.totalMoves / stats.totalGames).toFixed(1)} Züge/Spiel`
                  : 'Keine Züge'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abgeschlossene Spiele</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResults}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalResults > 0 && stats.totalGames > 0
                  ? `${((stats.totalResults / stats.totalGames) * 100).toFixed(0)}% abgeschlossen`
                  : 'Keine Ergebnisse'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Siegesrate X</CardTitle>
              <Trophy className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalResults > 0
                  ? `${((stats.xWins / stats.totalResults) * 100).toFixed(0)}%`
                  : '0%'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.xWins} von {stats.totalResults} Siegen
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Games */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Aktive Spiele</CardTitle>
            </CardHeader>
            <CardContent>
              {activeGames.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Keine aktiven Spiele</p>
                  <p className="text-sm">Starte ein neues Spiel, um loszulegen!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeGames.slice(0, 5).map((item) => (
                    <div
                      key={item.game.record_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">
                          {item.game.fields.spieler_x_vorname} {item.game.fields.spieler_x_nachname}
                          <span className="mx-2 text-muted-foreground">vs</span>
                          {item.game.fields.spieler_o_vorname} {item.game.fields.spieler_o_nachname}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.movesCount} Züge
                          {item.lastMove && (
                            <span className="ml-2">
                              • Letzter Zug:{' '}
                              {item.lastMove.fields.spieler === 'x' ? 'Spieler X' : 'Spieler O'}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">Aktiv</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Chart */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Ergebnisverteilung</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Noch keine Ergebnisse vorhanden</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {chartData.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.xWins}</div>
                    <div className="text-xs text-muted-foreground">X gewinnt</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{stats.draws}</div>
                    <div className="text-xs text-muted-foreground">Unentschieden</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.oWins}</div>
                    <div className="text-xs text-muted-foreground">O gewinnt</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && !submitting && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
