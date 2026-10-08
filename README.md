# findheure

Horloge plein écran personnalisable, en une seule page (`index.html` + `support.js`, décors dans `scenes.js`).

**Le principe : on clique sur ce qu’on veut changer.** Un menu s’ouvre là où on a cliqué, comme le clic droit sur Windows (le clic droit marche aussi) :
- **clic sur l’heure** : déplacer, taille, police, couleur, effets, animation des chiffres, secondes, format 12/24 h, date, message (et, en mode minuteur ou chrono : démarrer, durée, sonnerie, épingler…) ;
- **clic sur la date** : format, langue, police, couleur, opacité, taille, message, autres villes ;
- **clic sur le fond** : thèmes, thème selon la date, type de fond, décor, couleurs, ma photo en fond, ambiance, nouvelle note, image à côté de l’heure, Surprends-moi, plein écran, Paramètres, aide ;
- **clic sur une note, une image ou une carte épinglée** : son menu (couleur, taille, mettre devant, ranger, supprimer…).

Les lignes avec une flèche › ouvrent un sous-menu au survol ou au clic (pratique sur un tableau tactile) ; Échap ou un clic à côté ferme le menu.
**Pour déplacer l’heure**, on appuie dessus et on la glisse : neuf emplacements apparaissent, elle s’aimante à celui où on la lâche.

La **barre du haut** ne garde que l’essentiel : horloge, minuteur, chrono, sonomètre, site ou image, **Paramètres** (format de l’heure, date, langue, position, autres villes, boutons qui se cachent… et, tout en bas, les réglages avancés), plein écran et aide. Quand la souris ne bouge plus, elle remonte et s’aspire dans le haut de l’écran comme une notification, puis redescend avec un petit rebond dès qu’on bouge.

- **Thème par défaut : Halloween** — cimetière, citrouilles, chauves-souris, fantôme, lune et brume.
- **Saisons & fêtes**, chacune avec son vrai décor animé : Rentrée (tableau noir à la craie), Automne (forêt, feuilles qui tombent), Halloween, Hiver (montagnes, aurore boréale, chalet), Noël (village enneigé, sapin illuminé, traîneau), Nouvel An (ville et feux d’artifice), Saint-Valentin, Printemps (cerisiers, papillons), Poisson d’avril (fond marin), Pâques (lapin, poussins, œufs), Fête de la musique (concert), Été (plage, voilier, vagues), 14 Juillet (tour Eiffel qui scintille) — et un bouton pour **changer de thème tout seul selon la date**.
- **Autres thèmes**, eux aussi avec leur décor : Papier (feuille Seyès, avions en papier), Néon (rue sous la pluie), Terminal (écran cathodique), Coucher de soleil (synthwave), Bonbon, Brutal, Cosmos (planètes, astronaute), Arcade (envahisseurs en pixels), Luxe (Art déco), Matrice (tableau à LED), Glacier (icebergs, manchots), Iso 3D (ville isométrique), Gothique (vitraux, bougies), Londres (Big Ben doré dont les aiguilles donnent la vraie heure, grande roue qui tourne, bus rouge et taxi sur le pont de Westminster, crachin), Grille (cases qui s’allument derrière la souris), Hologramme, Psyché.
- Les décors ne bougent qu’avec des animations légères (fluides même sur un vieil ordinateur) et un voile doux derrière l’heure la garde lisible. Tous les boutons et textes sont vérifiés pour rester lisibles sur chaque thème.
- **Animations des chiffres** (fondu, chute, toupie, fonte, rebond, glitch, machine à sous…) et **effets bizarres** permanents (vague, gelée, tremblote, lévitation, arc-en-ciel, liquide, hologramme, reflet…).
- **Minuteur visuel** (disque qui se vide et passe du vert à l’orange puis au rouge) et **chrono** (avec tours), dessinés dans le style choisi. Durées toutes prêtes ou **Personnaliser** pour taper heures, minutes et secondes.
- **Sonnerie de fin** au choix (carillon, cloche, sonnerie d’école, réveil, gong) avec volume et bouton « Écouter » : elle sonne une fois, fort, et part à l’heure même si l’onglet est en arrière-plan.
- **Sonomètre** : un cadran montre le bruit de la classe (vert → rouge), avec seuil d’alerte, sensibilité, compteur de dépassements et bip en option. Le son est analysé dans le navigateur, rien n’est enregistré ni envoyé.
- **Afficher sur l’horloge** : le minuteur, le chrono et le sonomètre restent sur l’écran de l’heure, dans des cartes qu’on déplace à la souris ; un clic dessus ouvre leur menu (taille, ranger dans le coin, ouvrir en grand, retirer).
- **Site ou image** : afficher un site (YouTube, Google Slides, Canva…) ou un fichier de l’ordinateur (image, vidéo, PDF) en plein écran, avec l’heure dans une carte qu’on déplace et qu’on agrandit. Certains sites (Pronote, ENT, Google) refusent d’être affichés dans un autre site.
- **Tuto** à la première visite : cinq étapes pour comprendre le principe (cliquer sur l’heure, sur le fond, la barre, les Paramètres).
- **Guide complet** (bouton « ? ») : 28 étapes ; à certaines, c’est toi qui fais (« À toi : clique sur l’heure… ») et le guide passe à la suite tout seul quand c’est fait.
- Quand le fond est une de tes photos (par exemple après « Surprends-moi »), un bouton **Supprimer cette image** apparaît en bas à gauche, avec annulation possible.
- **Salutations** au-dessus de l’heure (clic sur l’heure ou la date → Message → Salutation) : plus de 70 en français et plus de 50 en anglais, espagnol et allemand, selon le moment (petit matin, matinée, midi, après-midi, fin de journée, soirée, nuit) et le jour (bon lundi, bon mercredi, bientôt le week-end le vendredi, bon samedi…). Elle change toutes les demi-heures et d’un jour à l’autre.
- **Notes autocollantes** (menu du fond ou touche `N`) : on les glisse par leur barre du haut et on change leur taille avec la poignée bien visible dans leur coin en bas à droite (ou Agrandir / Réduire dans leur menu).
- **Images à côté de l’heure** (menu du fond ou touche `I`) : une image de l’ordinateur posée sur l’écran, pas en fond. On la glisse où on veut, on tire le coin pour changer sa taille (ou − / +), elle reste enregistrée.
- **Taille de l’heure et de la date** dans leur menu (clic sur l’heure ou sur la date).
- **Icône du site** (onglet, favoris, écran d’accueil) : on peut aussi « installer » le site comme une appli depuis le navigateur.

Raccourcis : `F` plein écran · `S` surprise · `N` nouvelle note · `I` image à côté de l’heure · `Espace` démarrer/pause · `R` remettre à zéro · `L` tour (chrono) · `Échap` fermer un menu.

Les réglages, styles, notes et minuteurs sont enregistrés dans le navigateur : rien n’est envoyé nulle part.
React est servi depuis le dossier `vendor/`, pour que le site marche même sur les réseaux d’établissement qui bloquent les sites externes.

Pour l’ouvrir en local, servir le dossier (par exemple `python3 -m http.server`) puis ouvrir `http://localhost:8000`.
