import unittest

from solver import ALL_VARS, EPS, close, optimize_counts, solve_state


def state(locked):
    value = {k: locked.get(k) for k in ALL_VARS}
    locked_map = {k: k in locked for k in ALL_VARS}
    return value, locked_map


class TestClose(unittest.TestCase):
    def test_treats_near_equal_floats_as_equal(self):
        self.assertTrue(close(0.1 + 0.2, 0.3))

    def test_treats_distinct_values_as_unequal(self):
        self.assertFalse(close(1, 2))


class TestSolveState(unittest.TestCase):
    def test_derives_downlink_bandwidth_from_speed_times_count(self):
        value, locked = state({'Ds': 10, 'Dc': 48})
        result, conflicts = solve_state(value, locked)
        self.assertEqual(result['DB'], 480)
        self.assertEqual(conflicts, [])

    def test_derives_uplink_count_from_bandwidth_over_speed(self):
        value, locked = state({'Us': 100, 'UB': 800})
        result, conflicts = solve_state(value, locked)
        self.assertEqual(result['Uc'], 8)
        self.assertEqual(conflicts, [])

    def test_derives_downlink_bandwidth_from_uplink_bandwidth_times_ratio(self):
        value, locked = state({'Us': 100, 'Uc': 4, 'R': 3})
        result, _ = solve_state(value, locked)
        self.assertEqual(result['UB'], 400)
        self.assertEqual(result['DB'], 1200)

    def test_derives_total_ports_from_downlink_plus_uplink_counts(self):
        value, locked = state({'Dc': 48, 'Uc': 8})
        result, _ = solve_state(value, locked)
        self.assertEqual(result['Tp'], 56)

    def test_derives_a_missing_addend_from_the_sum_rule(self):
        value, locked = state({'Tp': 56, 'Dc': 48})
        result, _ = solve_state(value, locked)
        self.assertEqual(result['Uc'], 8)

    def test_flags_a_product_conflict_when_all_three_values_disagree(self):
        value, locked = state({'Ds': 10, 'Dc': 48, 'DB': 100})
        _, conflicts = solve_state(value, locked)
        self.assertGreater(len(conflicts), 0)
        self.assertIn('Dc × Ds should equal DB', conflicts[0])

    def test_flags_a_sum_conflict_when_total_ports_disagrees(self):
        value, locked = state({'Dc': 48, 'Uc': 8, 'Tp': 100})
        _, conflicts = solve_state(value, locked)
        self.assertGreater(len(conflicts), 0)
        self.assertIn('Dc + Uc should equal Tp', conflicts[0])

    def test_leaves_under_determined_variables_none(self):
        value, locked = state({'Ds': 10})
        result, conflicts = solve_state(value, locked)
        self.assertIsNone(result['Dc'])
        self.assertIsNone(result['DB'])
        self.assertEqual(conflicts, [])


class TestOptimizeCounts(unittest.TestCase):
    # N=32, Us=400G, Ds=100G -> expected Uc/Dc/actualR per over_sub target.
    CASES = [
        (1, 7, 25, 25 / 28),
        (2, 4, 28, 1.75),
        (3, 3, 29, 29 / 12),
        (4, 2, 30, 3.75),
        (5, 2, 30, 3.75),
        (6, 2, 30, 3.75),
        (7, 2, 30, 3.75),
        (8, 1, 31, 7.75),
    ]

    def test_matches_expected_split_per_ratio(self):
        for R, Uc, Dc, actual_r in self.CASES:
            with self.subTest(R=R):
                result = optimize_counts(N=32, R=R, Us=400, Ds=100)
                self.assertEqual(result['Uc'], Uc)
                self.assertEqual(result['Dc'], Dc)
                self.assertTrue(close(result['actualR'], actual_r))
                self.assertLessEqual(result['actualR'], R + EPS)
                self.assertEqual(result['Uc'] + result['Dc'], 32)

    def test_returns_none_for_non_positive_inputs(self):
        self.assertIsNone(optimize_counts(N=0, R=4, Us=400, Ds=100))
        self.assertIsNone(optimize_counts(N=32, R=4, Us=0, Ds=100))
        self.assertIsNone(optimize_counts(N=32, R=-1, Us=400, Ds=100))

    def test_clamps_uc_to_at_least_1_when_ratio_is_very_loose(self):
        result = optimize_counts(N=32, R=1000, Us=400, Ds=100)
        self.assertEqual(result['Uc'], 1)
        self.assertEqual(result['Dc'], 31)

    def test_clamps_uc_to_n_when_ratio_is_0(self):
        result = optimize_counts(N=32, R=0, Us=400, Ds=100)
        self.assertEqual(result['Uc'], 32)
        self.assertEqual(result['Dc'], 0)
        self.assertEqual(result['actualR'], 0)


if __name__ == '__main__':
    unittest.main()
