"""Basic local tests: python -m unittest discover -s tests"""
import os
import tempfile
import unittest
import app

class ZelarTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        app.DB = os.path.join(self.temp.name,"test.db")
        app.setup()

    def tearDown(self):
        self.temp.cleanup()

    def test_multiple_homes_isolated_by_room(self):
        a = app.add_home("Casa A")
        b = app.add_home("Casa B")
        ra = app.add_room(a,"Sala")
        rb = app.add_room(b,"Quarto")
        app.add_device(ra,"Presença","FP2","fp2a")
        app.add_device(rb,"Porta","P2","p2b")
        app.ingest("fp2a","presence",True)
        snap = app.snapshot()
        self.assertEqual(len(snap["homes"]),2)
        self.assertEqual(len(snap["events"]),1)
        self.assertEqual(snap["devices"][0]["room_id"],ra)
        self.assertEqual(snap["devices"][1]["room_id"],rb)

    def test_alert_generated(self):
        h = app.add_home("Casa")
        r = app.add_room(h,"Quarto")
        app.add_device(r,"FP2","FP2","fp2-1")
        app.ingest("fp2-1","fall_candidate",True)
        self.assertEqual(len(app.snapshot()["alerts"]),1)

    def test_unknown_device_rejected(self):
        with self.assertRaises(LookupError):
            app.ingest("missing","presence",True)

if __name__ == "__main__":
    unittest.main()
