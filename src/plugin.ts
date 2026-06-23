import streamDeck from "@elgato/streamdeck";

import { SpeedTestAction } from "./actions/speed-test";

// Log at info level; raise to "trace" to record all Stream Deck <-> plugin messages.
streamDeck.logger.setLevel("info");

// Register the network quality test action.
streamDeck.actions.registerAction(new SpeedTestAction());

// Connect to the Stream Deck.
streamDeck.connect();
