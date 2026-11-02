# Kotlin Serialization
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

-dontnote kotlinx.serialization.**
-keepclassmembers class * {
    *** Companion;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}

# Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**

# Hilt
-keep class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}
