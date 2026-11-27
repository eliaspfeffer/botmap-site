from unittest import TestCase

from check_testflight import is_installable


class TestFlightAvailability(TestCase):
    def test_only_a_named_installable_botmap_invite_is_published(self):
        invite = "https://testflight.apple.com/join/Example1"
        title = "<title>Join the Botmap beta - TestFlight - Apple</title>"
        button = '<a class="button button-outline" href="itms-beta://testflight.apple.com/join/Example1" target="_self">'

        self.assertTrue(is_installable(invite, title + button + "View in TestFlight</a>"))
        self.assertFalse(is_installable(invite, title + button + "</a>"))
        self.assertFalse(is_installable(invite, title.replace("Botmap", "Another App") + button + "View in TestFlight</a>"))
        self.assertFalse(is_installable(invite, title + button.replace("Example1", "Example2") + "View in TestFlight</a>"))
