// Lightweight Runtime Test Runner
// Supports describe, it, expect, and async tests

export const testState = {
    suites: [],
    currentSuite: null,
    results: {
        passed: 0,
        failed: 0,
        total: 0,
        suites: []
    }
};

export function describe(name, fn) {
    const suite = {
        name,
        tests: [],
        setup: null,
        teardown: null
    };

    const prevSuite = testState.currentSuite;
    testState.currentSuite = suite;

    fn(); // Execute the suite function to register tests

    testState.suites.push(suite);
    testState.currentSuite = prevSuite;
}

export function it(name, fn) {
    if (!testState.currentSuite) {
        throw new Error('Tests must be defined within a describe block');
    }

    testState.currentSuite.tests.push({
        name,
        fn
    });
}

export function expect(actual) {
    return {
        toBe: (expected) => {
            if (actual !== expected) {
                throw new Error(`Expected ${expected} but received ${actual}`);
            }
        },
        toEqual: (expected) => {
            const actualJson = JSON.stringify(actual);
            const expectedJson = JSON.stringify(expected);
            if (actualJson !== expectedJson) {
                throw new Error(`Expected ${expectedJson} but received ${actualJson}`);
            }
        },
        toBeTruthy: () => {
            if (!actual) {
                throw new Error(`Expected value to be truthy but received ${actual}`);
            }
        },
        toBeFalsy: () => {
            if (actual) {
                throw new Error(`Expected value to be falsy but received ${actual}`);
            }
        },
        toContain: (item) => {
            if (!actual || !actual.includes(item)) {
                throw new Error(`Expected ${JSON.stringify(actual)} to contain ${item}`);
            }
        },
        toBeGreaterThan: (number) => {
            if (!(actual > number)) {
                throw new Error(`Expected ${actual} to be greater than ${number}`);
            }
        }
    };
}

export async function runTests() {
    console.log('🧪 Starting Test Run...');

    // Reset results
    testState.results = {
        passed: 0,
        failed: 0,
        total: 0,
        suites: []
    };

    const results = testState.results;

    for (const suite of testState.suites) {
        const suiteResult = {
            name: suite.name,
            tests: []
        };

        console.group(`Suite: ${suite.name}`);

        for (const test of suite.tests) {
            const testResult = {
                name: test.name,
                passed: false,
                error: null,
                duration: 0
            };

            const start = performance.now();

            try {
                await test.fn();
                testResult.passed = true;
                results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                testResult.passed = false;
                testResult.error = error.message;
                results.failed++;
                console.error(`❌ ${test.name}:`, error.message);
            }

            testResult.duration = performance.now() - start;
            suiteResult.tests.push(testResult);
            results.total++;
        }

        results.suites.push(suiteResult);
        console.groupEnd();
    }

    console.log(`🏁 Tests Complete: ${results.passed}/${results.total} Passed`);
    return results;
}
